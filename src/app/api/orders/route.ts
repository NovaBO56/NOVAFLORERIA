import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/validations/orders";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { publicOrderError } from "@/lib/public/order-error";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const allowed = await checkRateLimit(supabase, request, "createOrder");

    if (!allowed) {
      return rateLimitResponse();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 },
      );
    }
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ?? "Datos de pedido inválidos.",
        },
        { status: 400 },
      );
    }

    const {
      customer_name,
      customer_phone,
      customer_whatsapp,
      items,
      customer_message,
      idempotency_key,
      promotion_id,
    } = result.data;

    const { data: orderId, error } = await createAdminClient().rpc("create_order", {
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_customer_whatsapp: customer_whatsapp || null,
      p_items: items,
      p_customer_message: customer_message || null,
      p_idempotency_key: idempotency_key,
      p_promotion_id: promotion_id || null,
    });

    if (error) {
      if (error.code === "P0001") {
        console.error("Pedido rechazado:", error);
        return NextResponse.json(
          { success: false, message: publicOrderError(error.message) },
          { status: 400 },
        );
      }

      console.error("Error creando pedido:", error);
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear el pedido. Intenta de nuevo.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, order_id: orderId },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "No se pudo procesar el pedido." },
      { status: 500 },
    );
  }
}
