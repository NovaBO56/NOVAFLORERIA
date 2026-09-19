import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { advanceOrderStatusSchema } from "@/validations/sales";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = advanceOrderStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Estado no válido." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("advance_order_status", {
      p_order_id: id,
      p_new_status: result.data.new_status,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error avanzando el estado del pedido:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar el estado." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Estado actualizado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el estado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}