import { orderDelivery } from "@/lib/public/order-journey";

export type DetailPayment = { id: string; status: string; confirmed_at?: string | null; created_at?: string; rejected_at?: string | null; rejection_reason?: string | null; method: string; amount?: number; reference?: string | null; qr_slot?: string | null; qr_label?: string | null };
export type ScheduleFields = { scheduled_for: string | null; schedule_status: "pending" | "proposed" | "confirmed"; schedule_revision: number; schedule_updated_at: string | null; schedule_updated_by: string | null };
export type RecipeSnapshot = { version: number; captured_at: string; basis: string; materials: { name: string; unit: string; item_type: string; quantity_per_unit: number }[]; included_products: { name: string; quantity_per_unit: number }[] };
export type OrderHistoryEntry = { id: string; at: string; label: string; from: string | null; to: string | null; actor: string | null; scheduled_for: string | null; schedule_status: string | null };

export function orderProgress(order: { status: string; order_type: string; total: number; customer_message: string | null; cancellation_reason?: string | null; payments: DetailPayment[] }) {
  const physical = order.order_type === "fisica";
  const delivery = orderDelivery(order.customer_message);
  const stopped = ["cancelado", "rechazado"].includes(order.status);
  const expired = order.status === "cancelado" && order.cancellation_reason === "Reserva de inventario vencida.";
  const confirmedPayment = order.payments.some(p => p.status === "confirmado" && Boolean(p.confirmed_at));
  const reported = order.payments.length > 0;
  const position = ["confirmado", "en_preparacion", "listo", "finalizado"].indexOf(order.status);
  const operational = !stopped && position >= 0;
  const steps = physical ? [
    { label: "Venta registrada", complete: true },
    { label: Number(order.total) === 0 ? "Sin pago requerido" : "Cobro registrado", complete: Number(order.total) === 0 || confirmedPayment },
    { label: "Venta finalizada", complete: order.status === "finalizado" },
  ] : [
    { label: "Pedido registrado", complete: true },
    ...(Number(order.total) === 0 ? [] : [{ label: "Pago reportado", complete: reported }, { label: "Pago confirmado", complete: confirmedPayment }]),
    ...(Number(order.total) === 0 ? [{ label: "Pedido confirmado", complete: operational }] : []),
    { label: "En preparación", complete: operational && position >= 1 },
    { label: delivery.pickup ? "Listo para recoger" : delivery.delivery ? "Listo para coordinar entrega" : "Listo", complete: operational && position >= 2 },
    { label: delivery.pickup ? "Retirado" : delivery.delivery ? "Entregado" : "Finalizado", complete: operational && position >= 3 },
  ];
  return { steps, stopped, expired, current: stopped || order.status === "finalizado" ? -1 : steps.findIndex(s => !s.complete) };
}

export function detailPaymentLabel(total: number, payments: DetailPayment[]) {
  if (Number(total) === 0) return "No requiere pago";
  if (payments.some(p => p.status === "confirmado" && p.confirmed_at)) return "Confirmado";
  if (payments.some(p => p.status === "pendiente")) return "Reportado, pendiente de verificación";
  if (payments.some(p => p.status === "rechazado")) return "Rechazado";
  return "Sin reportar";
}

export function laPazDateTime(value: string) {
  return new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function historyProjection(row: { id: string; table_name: string; action: string; created_at: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; user_id: string | null }, actor: string | null): OrderHistoryEntry | null {
  const old = row.before ?? {}, next = row.after ?? {};
  const scheduleChanged = old.scheduled_for !== next.scheduled_for || old.schedule_status !== next.schedule_status;
  const changedStatus = old.status !== next.status;
  if (row.action !== "INSERT" && !changedStatus && !scheduleChanged) return null;
  return { id: row.id, at: row.created_at, actor,
    label: row.table_name === "payments" ? "Estado del pago" : row.action === "INSERT" ? "Pedido registrado" : changedStatus ? "Estado del pedido" : "Horario actualizado",
    from: changedStatus && typeof old.status === "string" ? old.status : null, to: changedStatus && typeof next.status === "string" ? next.status : null,
    scheduled_for: scheduleChanged && typeof next.scheduled_for === "string" ? next.scheduled_for : null,
    schedule_status: scheduleChanged && typeof next.schedule_status === "string" ? next.schedule_status : null };
}
