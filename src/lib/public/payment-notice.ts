import type { PublicOrder } from "./types";
import { formatMoney } from "./format";
import { internationalBoliviaPhone } from "./phone";

export function paymentNotice(order: PublicOrder, name: string, phone: string) {
  return ["Hola Floristería Anabelle, reporté mi pago. Por favor revisen la transferencia.", `Pedido #${order.order_number}`, `Cliente: ${name || "Consultar ficha del pedido"}`, `Celular: ${internationalBoliviaPhone(phone) || phone}`, ...order.items.map(item => `${item.quantity} × ${item.product_name}: ${formatMoney(item.line_total)}${item.personalization?.length ? ` · ${item.personalization.map(option => `${option.name}: ${option.value}`).join(", ")}` : ""}${item.message ? ` · Tarjeta: ${item.message}` : ""}${item.note ? ` · Nota: ${item.note}` : ""}`), `Total: ${formatMoney(order.total)}`, "Método: QR · Pago reportado, pendiente de revisión", order.customer_message, `Administración: /admin/pedidos · Buscar #${order.order_number}`].filter(Boolean).join("\n");
}
