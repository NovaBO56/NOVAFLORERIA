import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema } from "@/validations/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de pedido inválidos." },
        { status: 400 },
      );
    }

    const { customer_name, customer_phone, customer_whatsapp, items, customer_message, idempotency_key } =
      result.data;

    const supabase = await createClient();

    const { data: orderId, error } = await supabase.rpc("create_order", {
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_customer_whatsapp: customer_whatsapp || null,
      p_items: items,
      p_customer_message: customer_message || null,
      p_idempotency_key: idempotency_key,
    });

    if (error) {
      // P0001 = excepción controlada de la función (stock insuficiente,
      // producto no disponible, etc.) — el mensaje ya es claro para el cliente.
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error creando pedido:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo crear el pedido. Intenta de nuevo." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, order_id: orderId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: "No se pudo procesar el pedido." },
      { status: 500 },
    );
  }
}