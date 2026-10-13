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

import { readSalesLedger } from "@/lib/reports/sales-ledger";


async function renderSalesReportPdf(summary: SalesReportSummary, rows: SalesReportOrderRow[], refunds: import("@/lib/reports/sales-ledger").SalesEvent[]) {
  return renderToBuffer(<SalesReportDocument summary={summary} orders={rows} refunds={refunds} />);
}

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

    const { events, summary } = await readSalesLedger(supabase, from, to);
    const rows: SalesReportOrderRow[] = events.filter(event => event.kind === "sale").map(event => ({
      order_number: event.order_number, order_type: event.order_type, status: event.order_status,
      total: Number(event.amount), created_at: event.occurred_at, customer_name: event.customer_name,
      payment_method: event.payment_method,
    }));
    const refunds = events.filter(event => event.kind === "refund");

    if (format === "pdf") {
      const buffer = await renderSalesReportPdf(summary, rows, refunds);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-ventas-${from}-a-${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, summary, orders: rows, refunds });
  } catch (error) {
    console.error("Error consultando datos administrativos:", error);
    const message = error instanceof Error ? error.message : "";
    const unauthorized = /^(Usuario|Rol|Acceso)/.test(message);
    return NextResponse.json({ success: false, message: unauthorized ? message : "No se pudieron obtener los datos." }, { status: unauthorized ? 403 : 500 });
  }
}