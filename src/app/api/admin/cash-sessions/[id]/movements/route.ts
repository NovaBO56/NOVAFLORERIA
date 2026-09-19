import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { recordCashMovementSchema } from "@/validations/cash-register";

type RouteContext = { params: Promise<{ id: string }> };

const MOVEMENT_SELECT =
  "id, cash_session_id, movement_type, payment_method, amount, direction, order_id, reason, created_by, created_at";

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cash_movements")
      .select(MOVEMENT_SELECT)
      .eq("cash_session_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo movimientos de caja:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los movimientos." }, { status: 500 });
    }

    return NextResponse.json({ success: true, movements: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = recordCashMovementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de movimiento inválidos." },
        { status: 400 },
      );
    }

    const { movement_type, amount, direction, reason, order_id } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("record_cash_movement", {
      p_cash_session_id: id,
      p_movement_type: movement_type,
      p_amount: amount,
      p_direction: direction || null,
      p_reason: reason || null,
      p_order_id: order_id || null,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error registrando movimiento de caja:", error);
      return NextResponse.json({ success: false, message: "No se pudo registrar el movimiento." }, { status: 500 });
    }

    return NextResponse.json({ success: true, movement_id: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el movimiento.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}