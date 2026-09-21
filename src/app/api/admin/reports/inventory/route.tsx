import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { InventoryReportDocument, type InventoryReportRow } from "@/lib/reports/inventory-report-pdf";

const inventoryReportQuerySchema = z.object({
  format: z.enum(["json", "pdf"]).optional().default("json"),
});

function withStockStatus(item: { current_stock: number; minimum_stock: number }): InventoryReportRow["stock_status"] {
  if (Number(item.current_stock) <= 0) return "agotado";
  if (Number(item.current_stock) <= Number(item.minimum_stock)) return "bajo";
  return "normal";
}

async function renderInventoryPdf(rows: InventoryReportRow[]) {
  return renderToBuffer(<InventoryReportDocument rows={rows} />);
}

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = inventoryReportQuerySchema.safeParse({
      format: searchParams.get("format") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Parámetros inválidos." },
        { status: 400 },
      );
    }

    const { format } = result.data;
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from("inventory_items")
      .select("name, item_type, unit, current_stock, minimum_stock")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo inventario para el reporte:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const rows: InventoryReportRow[] = (items ?? []).map((i) => ({
      name: i.name,
      item_type: i.item_type,
      unit: i.unit,
      current_stock: Number(i.current_stock),
      minimum_stock: Number(i.minimum_stock),
      stock_status: withStockStatus(i),
    }));

    if (format === "pdf") {
      const buffer = await renderInventoryPdf(rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="reporte-inventario.pdf"',
        },
      });
    }

    return NextResponse.json({ success: true, items: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}