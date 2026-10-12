import { NextResponse } from "next/server";
import { uuidSchema } from "@/validations/database-values";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    if (!uuidSchema.safeParse(id).success) return NextResponse.json({ success: false, message: "ID no válido." }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.rpc("confirm_payment", { p_payment_id: id });

    if (error) {
      if (error.code === "P0002" || error.message === "El pago no existe." || error.message === "El pedido no existe.") return NextResponse.json({ success: false, message: "El recurso no existe." }, { status: 404 });
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error confirmando el pago:", error);
      return NextResponse.json({ success: false, message: "No se pudo confirmar el pago." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Pago confirmado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo confirmar el pago.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}