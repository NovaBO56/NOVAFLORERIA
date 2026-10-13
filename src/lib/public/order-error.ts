/** RPC diagnostics stay on the server, never in the customer-facing response. */
export function publicOrderError(message: string): string {
  if (/stock insuficiente|lotes suficientes|inconsistencia de inventario/i.test(message)) {
    return "No contamos con suficiente stock para completar esta cantidad. Reduce la cantidad o elige otro producto para continuar.";
  }
  if (/receta|consumo de inventario|producto.*disponible|producto.*existe/i.test(message)) {
    return "Este producto ya no está disponible. Elige otro producto para continuar.";
  }
  if (/tienda.*cerrad|fuera de horario/i.test(message)) return "La tienda está cerrada y no acepta pedidos en este momento.";
  if (/promoci|descuento/i.test(message)) return "No se pudo aplicar la promoción. Revisa tu selección e intenta de nuevo.";
  if (/idempot|clave.*otra|solicitud.*diferente/i.test(message)) return "La compra cambió. Revisa tu pedido antes de volver a intentarlo.";
  return "No se pudo completar el pedido. Revisa tu compra e intenta de nuevo.";
}
