import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { openCashSessionSchema } from "@/validations/cash-register";

const SESSION_SELECT = `
  id, cash_register_id, opened_by, opened_at, opening_amount,
  closed_by, closed_at, expected_amount, counted_amount, difference_amount,
  status, closing_note, created_at,
  cash_register:cash_registers (name)
`;

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = await createClient();
    let query = supabase.from("cash_sessions").select(SESSION_SELECT).order("opened_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo sesiones de caja:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las sesiones." }, { status: 500 });
    }

    return NextResponse.json({ success: true, sessions: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = openCashSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("open_cash_session", {
      p_cash_register_id: result.data.cash_register_id,
      p_opening_amount: result.data.opening_amount,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error abriendo caja:", error);
      return NextResponse.json({ success: false, message: "No se pudo abrir la caja." }, { status: 500 });
    }

    return NextResponse.json({ success: true, session_id: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo abrir la caja.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}