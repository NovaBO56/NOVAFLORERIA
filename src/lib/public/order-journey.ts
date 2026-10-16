import { orderStatusLabels } from "./checkout";
import type { PublicOrder } from "./types";

export function orderJourney(order: PublicOrder) {
  // Delivery is part of the existing message contract, never a guessed address.
  const pickup = order.customer_message?.split("\n")[0] === "Método: Retiro en tienda";
  const delivery = order.customer_message?.split("\n")[0] === "Método: Entrega por coordinar";
  const methodLabel = pickup ? "Recojo en tienda" : delivery ? "Entrega por coordinar" : "Entrega o recojo por coordinar";
  const stopped = ["cancelado", "rechazado"].includes(order.status) || ["rechazado", "reembolsado"].includes(order.payment_status ?? "");
  const free = Number(order.total) === 0;
  const labels = ["Pedido registrado", ...(free ? [] : ["Pago reportado"]), free ? "Pedido confirmado" : "Pago confirmado", "En preparación", pickup ? "Listo para recoger" : "Listo para entregar", pickup ? "Retirado" : delivery ? "Entregado" : "Pedido finalizado"];
  const stages = ["confirmado", "en_preparacion", "listo", "finalizado"];
  const position = stages.indexOf(order.status);
  // Terminal/rejected orders do not imply that the intervening stages occurred.
  const current = stopped ? -1 : position >= 0 ? position + (free ? 1 : 2) : order.payment_status === "pendiente" ? 1 : 0;
  return { pickup, delivery, methodLabel, stopped, free, labels, current, waiting: !stopped && order.status === "pendiente_pago" && order.payment_status === "pendiente" };
}

export function orderGuide(order: PublicOrder, origin = "") {
  return `Floristería Anabelle\nPedido #${order.order_number}\nEstado al guardar: ${orderStatusLabels[order.status] ?? "Consulta con la tienda"}\nConsulta el estado actualizado en ${origin}/seguimiento en la web de la florería usando este número y el celular de tu compra.\nEsta guía no es un comprobante de pago ni una factura.\n`;
}

export function downloadOrderGuide(order: PublicOrder) {
  const url = URL.createObjectURL(new Blob([orderGuide(order, window.location.origin)], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `Anabelle-pedido-${order.order_number}.txt`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
