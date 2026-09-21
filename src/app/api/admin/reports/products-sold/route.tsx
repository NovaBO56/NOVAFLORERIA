import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { productsSoldReportQuerySchema } from "@/validations/reports";
import { ProductsSoldReportDocument, type ProductSoldRow } from "@/lib/reports/products-sold-report-pdf";

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

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .in("status", ACTIVE_STATUSES);

    if (ordersError) {
      console.error("Error obteniendo pedidos para el reporte:", ordersError);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const orderIds = (orders ?? []).map((o) => o.id);
    let rows: ProductSoldRow[] = [];

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("product_name_snapshot, quantity, line_total")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Error obteniendo productos vendidos:", itemsError);
        return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
      }

      const totals = new Map<string, { quantity: number; revenue: number }>();
      for (const item of items ?? []) {
        const key = item.product_name_snapshot;
        const current = totals.get(key) ?? { quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.line_total);
        totals.set(key, current);
      }

      rows = Array.from(totals.entries())
        .map(([product_name, v]) => ({ product_name, quantity: v.quantity, revenue: v.revenue }))
        .sort((a, b) => b.quantity - a.quantity);
    }

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
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}