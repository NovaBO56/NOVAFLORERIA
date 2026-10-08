import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackOrderSchema } from "@/validations/public-catalog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = trackOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const { order_number, order_id, customer_phone } = result.data;
    const supabase = await createClient();
    if (!await checkRateLimit(supabase, request, "trackOrder")) return rateLimitResponse();

    const { data, error } = await createAdminClient().rpc("track_order_details", {
      p_order_number: order_number ?? null,
      p_order_id: order_id ?? null,
      p_customer_phone: customer_phone,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: "No encontramos un pedido con ese número y teléfono." }, { status: 404 });
      }
      console.error("Error consultando el pedido:", error);
      return NextResponse.json({ success: false, message: "No se pudo consultar el pedido." }, { status: 500 });
    }

    const order = Array.isArray(data) ? data[0] : data;

    if (!order) {
      return NextResponse.json(
        { success: false, message: "No encontramos un pedido con ese número y teléfono." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error inesperado consultando el pedido:", error);
    return NextResponse.json({ success: false, message: "No se pudo consultar el pedido." }, { status: 500 });
  }
}
