import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { productsSoldReportQuerySchema } from "@/validations/reports";
import { ProductsSoldReportDocument, type ProductSoldRow } from "@/lib/reports/products-sold-report-pdf";

import { readAllPages } from "@/lib/db/read-all-pages";
import { cents } from "@/lib/money";

const ACTIVE_STATUSES = ["confirmado", "en_preparacion", "listo", "finalizado"];

async function renderProductsSoldPdf(from: string, to: string, rows: ProductSoldRow[]) {
  return renderToBuffer(<ProductsSoldReportDocument from={from} to={to} rows={rows} />);
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

    const items = await readAllPages<{ product_name_snapshot: string; quantity: number; line_total: number }>((start, end) => supabase
      .from("order_items")
      .select("id, product_name_snapshot, quantity, line_total, order:orders!inner(status, created_at)", { count: "exact" })
      .gte("order.created_at", `${from}T00:00:00-04:00`)
      .lte("order.created_at", `${to}T23:59:59.999999-04:00`)
      .in("order.status", ACTIVE_STATUSES)
      .order("id", { ascending: true })
      .range(start, end));
    const totals = new Map<string, { quantity: number; revenue: number }>();
    for (const item of items) {
      const current = totals.get(item.product_name_snapshot) ?? { quantity: 0, revenue: 0 };
      current.quantity += Math.round(Number(item.quantity) * 1000);
      current.revenue += cents(item.line_total);
      totals.set(item.product_name_snapshot, current);
    }
    const rows: ProductSoldRow[] = Array.from(totals.entries())
      .map(([product_name, value]) => ({ product_name, quantity: value.quantity / 1000, revenue: value.revenue / 100 }))
      .sort((a, b) => b.quantity - a.quantity);

    if (format === "pdf") {
      const buffer = await renderProductsSoldPdf(from, to, rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="productos-vendidos-${from}-a-${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, from, to, products: rows });
  } catch (error) {
    console.error("Error consultando datos administrativos:", error);
    const message = error instanceof Error ? error.message : "";
    const unauthorized = /^(Usuario|Rol|Acceso)/.test(message);
    return NextResponse.json({ success: false, message: unauthorized ? message : "No se pudieron obtener los datos." }, { status: unauthorized ? 403 : 500 });
  }
}