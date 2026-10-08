"use client";
import { formatMoney } from "@/lib/public/format";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/public/checkout";
import type { PublicOrder } from "@/lib/public/types";

export function OrderSummary({ order }: { order: PublicOrder }) {
  return <section className="min-w-0 space-y-4 break-words rounded-2xl border bg-white p-5" aria-live="polite">
    <h2 className="text-xl font-bold">Pedido #{order.order_number}</h2>
    <p>Estado: <strong>{orderStatusLabels[order.status] ?? "Consulta con la tienda"}</strong></p>
    <p>Pago: {Number(order.total) === 0 ? "No requiere pago: pedido gratuito" : order.payment_status ? paymentStatusLabels[order.payment_status] ?? "Consulta con la tienda" : "Sin reportar"}</p>
    {order.items.map((item, index) => <div key={index} className="border-b pb-3">
      <p>{item.quantity} × {item.product_name} — {formatMoney(item.line_total)}</p>
      {item.personalization?.map(option => <p key={option.id} className="text-sm text-gray-600">{option.name}: {option.value}</p>)}
      {item.message ? <p className="text-sm">Tarjeta: {item.message}</p> : null}
      {item.note ? <p className="text-sm">Nota: {item.note}</p> : null}
    </div>)}
    <p>Subtotal: {formatMoney(order.subtotal)}</p>
    <p>Descuento: {formatMoney(order.discount_total)}</p>
    <p className="text-xl font-bold">Total del pedido: {formatMoney(order.total)}</p>
    {order.customer_message ? <p className="whitespace-pre-wrap text-sm">{order.customer_message}</p> : null}
    {order.status === "pendiente_pago" && order.reserved_until ? <p className="text-sm">Reserva hasta {new Date(order.reserved_until).toLocaleString("es-BO", { timeZone: "America/La_Paz" })}. La tienda revisará tu pago antes de confirmarlo.</p> : null}
  </section>;
}
