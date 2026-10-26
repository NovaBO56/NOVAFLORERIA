import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackOrderSchema } from "@/validations/public-catalog";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

    // Read only the schedule of the order already authenticated by number/phone.
    const { data: schedule, error: scheduleError } = await createAdminClient()
      .from("orders").select("scheduled_for, schedule_status").eq("id", order.id).maybeSingle();
    if (scheduleError || !schedule) return NextResponse.json({ success: false, message: "No se pudo consultar el horario. Intenta nuevamente." }, { status: 503 });
    return NextResponse.json({ success: true, order: { ...order, scheduled_for: schedule.scheduled_for, schedule_status: schedule.schedule_status } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error inesperado consultando el pedido:", error);
    return NextResponse.json({ success: false, message: "No se pudo consultar el pedido." }, { status: 500 });
  }
}
