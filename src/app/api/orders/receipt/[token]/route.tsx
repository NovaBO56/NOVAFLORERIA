import { NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderReceiptDocument, type OrderReceiptData } from "@/lib/reports/order-receipt-pdf";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
  const unavailable = () => NextResponse.json({ success: false, message: "Recibo no disponible." }, { status: 404, headers });
  if (!z.string().uuid().safeParse(token).success) return unavailable();
  try {
    const server = createAdminClient();
    if (!await checkRateLimit(server, request, "orderReceipt")) return rateLimitResponse();
    const { data, error } = await server.rpc("get_public_order_receipt", { p_token: token });
    if (error) return NextResponse.json({ success: false, message: "No se pudo obtener el recibo." }, { status: 503, headers });
    if (!data) return unavailable();
    const order = data as OrderReceiptData;
    const buffer = await renderToBuffer(<OrderReceiptDocument order={order} />);
    return new NextResponse(new Uint8Array(buffer), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="recibo-anabelle-${order.order_number}.pdf"` } });
  } catch { return NextResponse.json({ success: false, message: "No se pudo obtener el recibo." }, { status: 503, headers }); }
}
