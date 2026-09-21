import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { productsSoldReportQuerySchema } from "@/validations/reports";
import { CancellationsReportDocument, type CancellationReportRow } from "@/lib/reports/cancellations-report-pdf";

async function renderCancellationsPdf(from: string, to: string, rows: CancellationReportRow[]) {
  return renderToBuffer(<CancellationsReportDocument from={from} to={to} rows={rows} />);
}

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = productsSoldReportQuerySchema.safeParse({
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
      .select("order_number, order_type, total, cancellation_reason, cancelled_at")
      .eq("status", "cancelado")
      .gte("cancelled_at", `${from}T00:00:00`)
      .lte("cancelled_at", `${to}T23:59:59`)
      .order("cancelled_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo cancelaciones para el reporte:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const rows: CancellationReportRow[] = (orders ?? []).map((o) => ({
      order_number: o.order_number,
      order_type: o.order_type,
      total: Number(o.total),
      cancellation_reason: o.cancellation_reason,
      cancelled_at: o.cancelled_at,
    }));

    if (format === "pdf") {
      const buffer = await renderCancellationsPdf(from, to, rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-cancelaciones-${from}-a-${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, from, to, cancellations: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}