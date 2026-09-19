import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { reviewDeletionRequestSchema } from "@/validations/sale-returns";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = reviewDeletionRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("review_order_deletion_request", {
      p_request_id: id,
      p_approve: result.data.approve,
      p_review_reason: result.data.review_reason,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error revisando solicitud:", error);
      return NextResponse.json({ success: false, message: "No se pudo revisar la solicitud." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.data.approve ? "Solicitud aprobada; pedido eliminado lógicamente." : "Solicitud rechazada.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo revisar la solicitud.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}