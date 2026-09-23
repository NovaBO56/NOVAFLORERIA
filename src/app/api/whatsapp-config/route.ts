import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const allowed = await checkRateLimit(
      supabase,
      request,
      "getWhatsappConfig",
    );

    if (!allowed) {
      return rateLimitResponse();
    }

    const { data, error } = await supabase
      .from("whatsapp_config")
      .select("phone_number")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo la configuración de WhatsApp:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo obtener el número de WhatsApp." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Todavía no hay un número de WhatsApp configurado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, whatsapp: data });
  } catch {
    return NextResponse.json(
      { success: false, message: "No se pudo obtener el número de WhatsApp." },
      { status: 500 },
    );
  }
}