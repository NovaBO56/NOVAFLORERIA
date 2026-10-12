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

import { readAllPages } from "@/lib/db/read-all-pages";
import { sumMoney } from "@/lib/money";

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

    const orders = await readAllPages<RawSalesOrderRow>((fromRow, toRow) => supabase
      .from("orders")
      .select(
        "order_number, order_type, status, total, created_at, customer:customers(name), payments(method, status)",
        { count: "exact" },
      )
      .gte("created_at", `${from}T00:00:00-04:00`)
      .lte("created_at", `${to}T23:59:59.999999-04:00`)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(fromRow, toRow));

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
      by_payment_method[key] = sumMoney([by_payment_method[key] ?? 0, r.total]);
    }

    const summary: SalesReportSummary = {
      from,
      to,
      total_sales: sumMoney(rows.map(r => r.total)),
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
    console.error("Error consultando datos administrativos:", error);
    const message = error instanceof Error ? error.message : "";
    const unauthorized = /^(Usuario|Rol|Acceso)/.test(message);
    return NextResponse.json({ success: false, message: unauthorized ? message : "No se pudieron obtener los datos." }, { status: unauthorized ? 403 : 500 });
  }
}