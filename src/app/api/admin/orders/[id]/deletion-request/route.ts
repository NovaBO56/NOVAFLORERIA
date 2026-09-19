import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { requestOrderDeletionSchema } from "@/validations/sale-returns";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = requestOrderDeletionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Falta el motivo." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("request_order_deletion", {
      p_order_id: id,
      p_reason: result.data.reason,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error solicitando eliminación:", error);
      return NextResponse.json({ success: false, message: "No se pudo crear la solicitud." }, { status: 500 });
    }

    return NextResponse.json({ success: true, request_id: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la solicitud.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}