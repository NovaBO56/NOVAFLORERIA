import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { CustomersReportDocument, type CustomerReportRow } from "@/lib/reports/customers-report-pdf";

const customersReportQuerySchema = z.object({
  format: z.enum(["json", "pdf"]).optional().default("json"),
});

const ACTIVE_STATUSES = ["confirmado", "en_preparacion", "listo", "finalizado"];

async function renderCustomersPdf(rows: CustomerReportRow[]) {
  return renderToBuffer(<CustomersReportDocument rows={rows} />);
}

type RawOrderWithCustomer = {
  total: number;
  customer: { name: string; phone: string | null } | { name: string; phone: string | null }[] | null;
};

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = customersReportQuerySchema.safeParse({
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

    const { data: orders, error } = await supabase
      .from("orders")
      .select("total, customer:customers(name, phone)")
      .not("customer_id", "is", null)
      .in("status", ACTIVE_STATUSES);

    if (error) {
      console.error("Error obteniendo pedidos para el reporte de clientes:", error);
      return NextResponse.json({ success: false, message: "No se pudo generar el reporte." }, { status: 500 });
    }

    const totals = new Map<string, { name: string; phone: string | null; order_count: number; total_spent: number }>();

    for (const o of (orders ?? []) as RawOrderWithCustomer[]) {
      const customer = Array.isArray(o.customer) ? o.customer[0] : o.customer;
      if (!customer) continue;

      const key = `${customer.name}-${customer.phone ?? ""}`;
      const current = totals.get(key) ?? {
        name: customer.name,
        phone: customer.phone,
        order_count: 0,
        total_spent: 0,
      };
      current.order_count += 1;
      current.total_spent += Number(o.total);
      totals.set(key, current);
    }

    const rows: CustomerReportRow[] = Array.from(totals.values()).sort((a, b) => b.total_spent - a.total_spent);

    if (format === "pdf") {
      const buffer = await renderCustomersPdf(rows);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="reporte-clientes.pdf"',
        },
      });
    }

    return NextResponse.json({ success: true, customers: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}