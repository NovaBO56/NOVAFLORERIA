import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackOrderSchema } from "@/validations/public-catalog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { withOrderItemImages, type OrderImageRow } from "@/lib/public/order-item-images";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 },
      );
    }
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

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("track_order_details", {
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

    // Read only the schedule of the order already authenticated by number/phone.
    const { data: schedule, error: scheduleError } = await admin
      .from("orders").select("scheduled_for, schedule_status").eq("id", order.id).maybeSingle();
    if (scheduleError || !schedule) return NextResponse.json({ success: false, message: "No se pudo consultar el horario. Intenta nuevamente." }, { status: 503 });
    // Photo metadata is optional and is read only after the order has passed number/phone authentication.
    // Historical names, prices and quantities remain the original RPC values.
    let items = order.items;
    if (Array.isArray(items) && items.length) {
      items = withOrderItemImages(items);
      try {
        const { data: photoRows, error: photoError } = await admin.from("order_items")
          .select("product_id, product_name_snapshot, quantity, unit_price_snapshot, line_total, product:products(images:product_images(public_url, alt_text, sort_order))")
          .eq("order_id", order.id);
        if (!photoError && Array.isArray(photoRows)) items = withOrderItemImages(order.items, photoRows as OrderImageRow[]);
      } catch { /* Images are optional: a storage/catalogue read must never hide the authenticated order. */ }
    }
    return NextResponse.json({ success: true, order: { ...order, ...(Array.isArray(items) ? { items } : {}), scheduled_for: schedule.scheduled_for, schedule_status: schedule.schedule_status } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error inesperado consultando el pedido:", error);
    return NextResponse.json({ success: false, message: "No se pudo consultar el pedido." }, { status: 500 });
  }
}
