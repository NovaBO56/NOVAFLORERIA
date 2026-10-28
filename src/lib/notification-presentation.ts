import { friendlyErrorMessage } from "./notice-presentation";

export function notificationMessage(message: string) {
  return friendlyErrorMessage(message, "Hay una actualización que necesita revisión en el administrador.")
    .replace(/\((\d+(?:\.\d+)?)\s+(unidad(?:es)?)\)/gi, (_match, value: string) => {
      const amount = Number(value);
      return "(" + amount.toLocaleString("es-BO", { maximumFractionDigits: 3 }) + " " + (amount === 1 ? "unidad" : "unidades") + ")";
    });
}

export function notificationPresentation(message: string) {
  const text = notificationMessage(message);
  const order = text.match(/pedido\s*#?\s*(\d+)/i)?.[1];
  if (/pago.*(?:pendiente|verificar|reportado)|(?:pendiente|verificar).*pago/i.test(text)) {
    return { tone: "warning" as const, title: "Pago por revisar", message: order ? "El cliente avisó de un pago para el pedido #" + order + ". Revisa la transferencia antes de confirmarlo." : text };
  }
  if (/pago.*confirmado|pedido.*confirmado/i.test(text)) return { tone: "success" as const, title: "Pago o pedido confirmado", message: text };
  if (/pedido.*listo/i.test(text)) return { tone: "success" as const, title: "Pedido listo", message: text };
  if (/agotad|sin stock|stock bajo|pocas unidades/i.test(text)) return { tone: "warning" as const, title: /agotad|sin stock/i.test(text) ? "Producto agotado" : "Existencias bajas", message: text };
  if (/rechazad|error|fall[oó]/i.test(text)) return { tone: "error" as const, title: "Necesita revisión", message: text };
  if (/cancelad|expirad|vencid/i.test(text)) return { tone: "warning" as const, title: "Actualización del pedido", message: text };
  if (/nuevo pedido|pedido.*(?:creado|registrado)/i.test(text)) return { tone: "info" as const, title: "Nuevo pedido", message: text };
  return { tone: "info" as const, title: "Actualización", message: text };
}
