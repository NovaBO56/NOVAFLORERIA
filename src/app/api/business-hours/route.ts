import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    return NextResponse.json({ success: true, status, week });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo obtener el horario." }, { status: 500 });
  }
}