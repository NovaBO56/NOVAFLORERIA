import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { productsSoldReportQuerySchema } from "@/validations/reports";
import { WasteReportDocument, type WasteReportRow } from "@/lib/reports/waste-report-pdf";

async function renderWastePdf(from: string, to: string, rows: WasteReportRow[]) {
  return renderToBuffer(<WasteReportDocument from={from} to={to} rows={rows} />);
}

type RawWasteRow = {
  quantity: number;
  reason: string;
  created_at: string;
  inventory_item: { name: string; unit: string } | { name: string; unit: string }[] | null;
};

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

    const { data: waste, error } = await supabase
      .from("inventory_waste")
      .select("quantity, reason, created_at, inventory_item:inventory_items(name, unit)")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo mermas para el reporte:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const rows: WasteReportRow[] = ((waste ?? []) as RawWasteRow[]).map((w) => {
      const item = Array.isArray(w.inventory_item) ? w.inventory_item[0] : w.inventory_item;
      return {
        item_name: item?.name ?? "Ítem eliminado",
        quantity: Number(w.quantity),
        unit: item?.unit ?? "",
        reason: w.reason,
        created_at: w.created_at,
      };
    });

    if (format === "pdf") {
      const buffer = await renderWastePdf(from, to, rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-mermas-${from}-a-${to}.pdf"`,
        },
      });
    }

    return NextResponse.json({ success: true, from, to, waste: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}