import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { orderContact } from "@/lib/public/order-contact";
import { listOrdersQuerySchema } from "@/validations/order-list";

type ListOrder = Parameters<typeof orderContact>[0] & Record<string, unknown>;

const ORDER_SELECT = `
  id, order_number, customer_id, order_type, status, subtotal, discount_total, total,
  customer_message, internal_note, reserved_until, cancelled_at, cancellation_reason,
  deleted_at, created_at, updated_at, guest_name, guest_phone, guest_whatsapp, receipt_token,
  payments(id, order_id, method, amount, reference, status, confirmed_at, qr_slot, qr_label),
  customer:customers (id, name, phone, whatsapp)
`;

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const parsed = listOrdersQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return NextResponse.json({ success: false, message: "Filtros de pedidos inválidos." }, { status: 400 });
    const { status, type, pending_payment, search, page, limit } = parsed.data;
    const supabase = await createClient();
    const matchingPayment = pending_payment;
    let select = ORDER_SELECT;
    if (matchingPayment) select += ", matching_payments:payments!inner(status)";
    if (search) select += ", search_customer:customers(id)";
    const buildQuery = () => {
      let query = supabase.from("orders").select(select, { count: "exact" })
        .is("deleted_at", null).order("created_at", { ascending: false }).order("id", { ascending: false });
      if (status === "activos") query = query.in("status", ["pendiente_pago", "confirmado", "en_preparacion", "listo"]);
      else if (status === "expirados") query = query.eq("status", "cancelado").eq("cancellation_reason", "Reserva de inventario vencida.");
      else if (status !== "todos") query = query.eq("status", status);
      if (type !== "todos") query = query.eq("order_type", type);
      if (matchingPayment) query = query.eq("matching_payments.status", "pendiente");
      if (search) {
        // Quoted PostgREST literals keep punctuation from becoming filter syntax.
        const pattern = JSON.stringify("*" + search.replace(/[\\%_*]/g, " ") + "*");
        query = query.or(`name.ilike.${pattern},phone.ilike.${pattern}`, { referencedTable: "search_customer" });
        const predicates = [`guest_name.ilike.${pattern}`, `guest_phone.ilike.${pattern}`, "search_customer.not.is.null"];
        if (/^\d+$/.test(search) && Number.isSafeInteger(Number(search))) predicates.push(`order_number.eq.${Number(search)}`);
        query = query.or(predicates.join(","));
      }
      return query;
    };
    let { data, error, count } = await buildQuery().range((page - 1) * limit, page * limit - 1);
    if (error?.code === "PGRST103") {
      const recount = await buildQuery().range(0, 0);
      error = recount.error; count = recount.count; data = [];
    }

    if (error) {
      console.error("Error obteniendo pedidos:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los pedidos." }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: ((data ?? []) as unknown as ListOrder[]).map(row => {
      const { matching_payments, search_customer, ...order } = row;
      void matching_payments; void search_customer;
      return orderContact(order);
    }), pagination: { page, limit, total: count ?? 0, total_pages: Math.max(1, Math.ceil((count ?? 0) / limit)) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}
