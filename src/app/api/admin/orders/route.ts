import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const ORDER_SELECT = `
  id, order_number, customer_id, order_type, status, subtotal, discount_total, total,
  customer_message, internal_note, reserved_until, cancelled_at, cancellation_reason,
  deleted_at, created_at, updated_at,
  customer:customers (id, name, phone, whatsapp)
`;

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = await createClient();
    let query = supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo pedidos:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los pedidos." }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}