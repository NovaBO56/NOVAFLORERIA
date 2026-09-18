import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { rejectPaymentSchema } from "@/validations/payments";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = rejectPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Falta el motivo de rechazo." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("reject_payment", {
      p_payment_id: id,
      p_reason: result.data.reason,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error rechazando el pago:", error);
      return NextResponse.json({ success: false, message: "No se pudo rechazar el pago." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Pago rechazado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo rechazar el pago.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}