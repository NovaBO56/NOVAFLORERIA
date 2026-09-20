import { salesReportQuerySchema } from "@/validations/reports";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  SalesReportDocument,
  type SalesReportOrderRow,
  type SalesReportSummary,
} from "@/lib/reports/sales-report-pdf";

const ACTIVE_STATUSES = ["confirmado", "en_preparacion", "listo", "finalizado"];

async function renderSalesReportPdf(summary: SalesReportSummary, rows: SalesReportOrderRow[]) {
  return renderToBuffer(<SalesReportDocument summary={summary} orders={rows} />);
}

type RawSalesOrderRow = {
  order_number: number;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
  customer: { name: string } | { name: string }[] | null;
  payments: { method: string; status: string }[] | null;
};
export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = salesReportQuerySchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      format: searchParams.get("format") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Parámetros de reporte inválidos." },
        { status: 400 },
      );
    }

    const { from, to, format } = result.data;

    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "order_number, order_type, status, total, created_at, customer:customers(name), payments(method, status)",
      )
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo reporte de ventas:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const rows: SalesReportOrderRow[] = (orders ?? []).map((o: RawSalesOrderRow) => {
      const paymentsList = Array.isArray(o.payments) ? o.payments : [];
      const confirmedPayment = paymentsList.find((p) => p.status === "confirmado");
      const customer = Array.isArray(o.customer) ? o.customer[0] : o.customer;

      return {
        order_number: o.order_number,
        order_type: o.order_type,
        status: o.status,
        total: Number(o.total),
        created_at: o.created_at,
        customer_name: customer?.name ?? null,
        payment_method: confirmedPayment?.method ?? null,
      };
    });

    const by_payment_method: Record<string, number> = {};
    for (const r of rows) {
      const key = r.payment_method ?? "sin_pago_confirmado";
      by_payment_method[key] = (by_payment_method[key] ?? 0) + r.total;
    }

    const summary: SalesReportSummary = {
      from,
      to,
      total_sales: rows.reduce((sum, r) => sum + r.total, 0),
      count_online: rows.filter((r) => r.order_type === "online").length,
      count_fisica: rows.filter((r) => r.order_type === "fisica").length,
      by_payment_method,
    };

    if (format === "pdf") {
      const buffer = await renderSalesReportPdf(summary, rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-ventas-${from}-a-${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, summary, orders: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}