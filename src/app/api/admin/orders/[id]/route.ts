import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const ORDER_SELECT = `
  id, order_number, customer_id, order_type, status, subtotal, discount_total, total,
  customer_message, internal_note, reserved_until, cancelled_at, cancellation_reason,
  created_at, updated_at,
  customer:customers (id, name, phone, whatsapp),
  order_items (id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total, personalization, message, note)
`;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo el pedido:", error);
      return NextResponse.json({ success: false, message: "No se pudo obtener el pedido." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "El pedido no existe." }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}