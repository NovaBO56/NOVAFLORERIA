import { orderStatusLabels } from "./checkout";
import type { PublicOrder } from "./types";

export function orderDelivery(message: string | null) {
  // Delivery is part of the existing message contract, never a guessed address.
  const pickup = message?.split("\n")[0] === "Método: Retiro en tienda";
  const delivery = message?.split("\n")[0] === "Método: Entrega por coordinar";
  const methodLabel = pickup ? "Recojo en tienda" : delivery ? "Entrega por coordinar" : "Entrega o recojo por coordinar";
  return { pickup, delivery, methodLabel };
}

export function orderJourney(order: PublicOrder) {
  const { pickup, delivery, methodLabel } = orderDelivery(order.customer_message);
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

export function journeyMessage(label: string) {
  return ({
    "Pedido registrado": "Tu pedido fue registrado. Completa el pago y reporta tu aviso para que la tienda lo revise.",
    "Pago reportado": "Estamos verificando tu pago. El aviso todavía no es una confirmación.",
    "Pago confirmado": "La florería verificó tu pago. Tu pedido puede pasar a preparación.",
    "Pedido confirmado": "No requiere pago. Tu pedido puede pasar a preparación.",
    "En preparación": "Estamos preparando tus flores con atención a cada detalle.",
    "Listo para recoger": "Tu pedido está listo. Coordina el recojo con la tienda.",
    "Listo para entregar": "Tu pedido está listo. Coordina la entrega con la tienda; no implica que esté en camino.",
    "Retirado": "Tu pedido figura como retirado en tienda. ¡Gracias por confiar en nosotros!",
    "Entregado": "Tu pedido figura como entregado. ¡Gracias por confiar en nosotros!",
    "Pedido finalizado": "La tienda finalizó tu pedido. ¡Gracias por confiar en nosotros!",
  } as Record<string, string>)[label] ?? "Estado registrado por la tienda.";
}

export function downloadOrderGuide(order: PublicOrder) {
  const url = URL.createObjectURL(new Blob([orderGuide(order, window.location.origin)], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `Anabelle-pedido-${order.order_number}.txt`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
