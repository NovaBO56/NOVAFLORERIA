import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createPhysicalSaleSchema } from "@/validations/sales";

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createPhysicalSaleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de venta inválidos." },
        { status: 400 },
      );
    }

    const { items, discount_total, payment_method } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_physical_sale", {
      p_items: items,
      p_discount_total: discount_total,
      p_payment_method: payment_method,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error registrando venta física:", error);
      return NextResponse.json({ success: false, message: "No se pudo registrar la venta." }, { status: 500 });
    }

    const sale = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar la venta.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}