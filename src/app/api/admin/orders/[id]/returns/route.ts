import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createSaleReturnSchema } from "@/validations/sale-returns";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sale_returns")
      .select("id, order_id, type, amount, reason, created_by, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo devoluciones:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las devoluciones." }, { status: 500 });
    }

    return NextResponse.json({ success: true, returns: data });
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
    const result = createSaleReturnSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de devolución inválidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_sale_return", {
      p_order_id: id,
      p_type: result.data.type,
      p_amount: result.data.amount,
      p_reason: result.data.reason,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error registrando devolución:", error);
      return NextResponse.json({ success: false, message: "No se pudo registrar la devolución." }, { status: 500 });
    }

    return NextResponse.json({ success: true, return_id: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar la devolución.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}