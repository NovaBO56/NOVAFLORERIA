import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const allowed = await checkRateLimit(supabase, request, "getPaymentQr");

    if (!allowed) {
      return rateLimitResponse();
    }

    const { data, error } = await supabase
      .from("payment_qr_config")
      .select("qr_public_url, account_label")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo el QR de pago:", error);
      return NextResponse.json({ success: false, message: "No se pudo obtener el QR de pago." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Todavía no hay un QR de pago configurado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, qr: data });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo obtener el QR de pago." }, { status: 500 });
  }
}