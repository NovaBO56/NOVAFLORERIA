import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { OrderReceiptDocument, type OrderReceiptData } from "@/lib/reports/order-receipt-pdf";

type RouteContext = { params: Promise<{ id: string }> };

type RawOrderReceipt = {
  order_number: number;
  order_type: string;
  status: string;
  created_at: string;
  subtotal: number;
  discount_total: number;
  total: number;
  customer: { name: string; phone: string | null } | { name: string; phone: string | null }[] | null;
  order_items: { product_name_snapshot: string; quantity: number; unit_price_snapshot: number; line_total: number }[];
  payments: { method: string; status: string }[] | null;
};

async function renderReceiptPdf(order: OrderReceiptData) {
  return renderToBuffer(<OrderReceiptDocument order={order} />);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `order_number, order_type, status, created_at, subtotal, discount_total, total,
         customer:customers(name, phone),
         order_items(product_name_snapshot, quantity, unit_price_snapshot, line_total),
         payments(method, status)`,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo el pedido para el comprobante:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el comprobante." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, message: "El pedido no existe." }, { status: 404 });
    }

    const raw = data as RawOrderReceipt;
    const customer = Array.isArray(raw.customer) ? raw.customer[0] : raw.customer;
    const confirmedPayment = (raw.payments ?? []).find((p) => p.status === "confirmado") ?? raw.payments?.[0] ?? null;

    const order: OrderReceiptData = {
      order_number: raw.order_number,
      order_type: raw.order_type,
      status: raw.status,
      created_at: raw.created_at,
      customer_name: customer?.name ?? null,
      customer_phone: customer?.phone ?? null,
      items: raw.order_items.map((item) => ({
        product_name: item.product_name_snapshot,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price_snapshot),
        line_total: Number(item.line_total),
      })),
      subtotal: Number(raw.subtotal),
      discount_total: Number(raw.discount_total),
      total: Number(raw.total),
      payment_method: confirmedPayment?.method ?? null,
      payment_status: confirmedPayment?.status ?? null,
    };

    const buffer = await renderReceiptPdf(order);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="comprobante-pedido-${order.order_number}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el comprobante.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}