import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { qrSlotLabel, type QrSlot } from "@/lib/public/payment-qrs";
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
      .select("qr_slot, qr_public_url, account_label")
      .eq("is_active", true)
      .order("qr_slot", { ascending: true });

    if (error) {
      console.error("Error obteniendo el QR de pago:", error);
      return NextResponse.json({ success: false, message: "No se pudo obtener el QR de pago." }, { status: 500 });
    }

    if (!data?.length) {
      return NextResponse.json(
        { success: false, message: "Todavía no hay un QR de pago configurado." },
        { status: 404 },
      );
    }

    const qrs = data.filter(qr => qr.qr_public_url).map(qr => ({ ...qr, account_label: qr.account_label || qrSlotLabel(qr.qr_slot as QrSlot) }));
    if (!qrs.length) return NextResponse.json({ success: false, message: "No hay un QR de pago disponible." }, { status: 404 });
    return NextResponse.json({ success: true, qr: qrs[0], qrs });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo obtener el QR de pago." }, { status: 500 });
  }
}