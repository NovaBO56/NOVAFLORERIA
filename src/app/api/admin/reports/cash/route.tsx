import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { productsSoldReportQuerySchema } from "@/validations/reports";
import { CashReportDocument, type CashSessionReportRow } from "@/lib/reports/cash-report-pdf";

async function renderCashPdf(from: string, to: string, rows: CashSessionReportRow[]) {
  return renderToBuffer(<CashReportDocument from={from} to={to} rows={rows} />);
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

    const { data: sessions, error } = await supabase
      .from("cash_sessions")
      .select("opened_at, closed_at, opening_amount, expected_amount, counted_amount, difference_amount, status")
      .gte("opened_at", `${from}T00:00:00`)
      .lte("opened_at", `${to}T23:59:59`)
      .order("opened_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo sesiones de caja para el reporte:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const rows: CashSessionReportRow[] = (sessions ?? []).map((s) => ({
      opened_at: s.opened_at,
      closed_at: s.closed_at,
      opening_amount: Number(s.opening_amount),
      expected_amount: s.expected_amount != null ? Number(s.expected_amount) : null,
      counted_amount: s.counted_amount != null ? Number(s.counted_amount) : null,
      difference_amount: s.difference_amount != null ? Number(s.difference_amount) : null,
      status: s.status,
    }));

    if (format === "pdf") {
      const buffer = await renderCashPdf(from, to, rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-caja-${from}-a-${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, from, to, sessions: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}