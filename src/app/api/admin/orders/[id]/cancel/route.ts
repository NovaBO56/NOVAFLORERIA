import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { cancelOrderSchema } from "@/validations/orders";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const profile = await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = cancelOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Falta el motivo de cancelación." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_order", {
      p_order_id: id,
      p_reason: result.data.reason,
      p_cancelled_by: profile.id,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error cancelando pedido:", error);
      return NextResponse.json({ success: false, message: "No se pudo cancelar el pedido." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Pedido cancelado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cancelar el pedido.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}