import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const allowed = await checkRateLimit(supabase, request, "getBusinessHours");

    if (!allowed) {
      return rateLimitResponse();
    }

    const { data: status, error: statusError } = await supabase.rpc("get_business_status").maybeSingle();

    if (statusError) {
      console.error("Error obteniendo estado del horario:", statusError);
      return NextResponse.json({ success: false, message: "No se pudo obtener el horario." }, { status: 500 });
    }

    const { data: week, error: weekError } = await supabase
      .from("business_hours")
      .select("day_of_week, opens_at, closes_at, is_closed")
      .order("day_of_week", { ascending: true });

    if (weekError) {
      console.error("Error obteniendo el horario semanal:", weekError);
      return NextResponse.json({ success: false, message: "No se pudo obtener el horario." }, { status: 500 });
    }

    // This public field contains only an availability boolean. Missing or
    // malformed configuration fails closed for home delivery.
    const { data: deliverySetting, error: deliveryError } = await createAdminClient()
      .from("system_settings")
      .select("value")
      .eq("key", "delivery_enabled")
      .maybeSingle();

    if (deliveryError) {
      console.error("Error obteniendo disponibilidad de entrega:", deliveryError);
      return NextResponse.json({ success: false, message: "No se pudo obtener la disponibilidad de entrega." }, { status: 500 });
    }

    const deliveryValue = deliverySetting?.value as { enabled?: unknown } | null;
    const delivery_enabled = deliveryValue?.enabled === true;
    const publicStatus = status && typeof status === "object" && !Array.isArray(status)
      ? status as Record<string, unknown>
      : null;

    return NextResponse.json({ success: true, status: publicStatus ? { ...publicStatus, delivery_enabled } : null, week });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo obtener el horario." }, { status: 500 });
  }
}
