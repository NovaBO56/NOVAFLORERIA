import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { closeCashSessionSchema } from "@/validations/cash-register";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = closeCashSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("close_cash_session", {
      p_session_id: id,
      p_counted_amount: result.data.counted_amount,
      p_closing_note: result.data.closing_note || null,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error cerrando caja:", error);
      return NextResponse.json({ success: false, message: "No se pudo cerrar la caja." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Caja cerrada correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cerrar la caja.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}