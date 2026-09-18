import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_payment", {
      p_order_id: id,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error creando el pago:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo generar el pago para este pedido." },
        { status: 500 },
      );
    }

    const payment = Array.isArray(data) ? data[0] : data;

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "No se pudo generar el pago para este pedido." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo generar el pago." }, { status: 500 });
  }
}