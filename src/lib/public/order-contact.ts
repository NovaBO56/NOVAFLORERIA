type Customer = { id: string; name: string; phone: string | null; whatsapp: string | null };
type GuestOrder = { customer: Customer | Customer[] | null; guest_name: string | null; guest_phone: string | null; guest_whatsapp: string | null; receipt_token: string; payments: { status: string; confirmed_at: string | null }[] };
/** Preserve the UI contact shape without manufacturing a customers row. */
export function orderContact<T extends GuestOrder>(order: T) {
  const registered = Array.isArray(order.customer) ? order.customer[0] : order.customer;
  const customer = order.guest_name ? { id: registered?.id ?? null, name: order.guest_name, phone: order.guest_phone, whatsapp: order.guest_whatsapp } : registered;
  const eligible = (order.payments ?? []).some(payment => payment.status === "confirmado" && Boolean(payment.confirmed_at));
  return { ...order, customer, receipt_token: eligible ? order.receipt_token : null };
}
