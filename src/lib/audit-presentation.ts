const tables: Record<string, string> = { orders: "Pedido", payments: "Pago", inventory_entries: "Entrada de inventario", inventory_adjustments: "Ajuste de inventario", inventory_waste: "Merma", inventory_items: "Insumo", inventory_movements: "Movimiento de inventario", cash_sessions: "Sesión de caja", cash_movements: "Movimiento de caja", system_settings: "Configuración", products: "Producto", promotions: "Promoción", profiles: "Usuario", whatsapp_config: "WhatsApp", payment_qr_config: "QR de pago" };
const states: Record<string,string> = { pendiente_pago: "Pendiente de pago", pendiente: "Pendiente de revisión", confirmado: "Confirmado", rechazado: "Rechazado", cancelado: "Cancelado", en_preparacion: "En preparación", listo: "Listo", finalizado: "Finalizado" };
export function auditPresentation(entry: Record<string, unknown>) {
  const after = (entry.after ?? entry.presentation_details ?? {}) as Record<string, unknown>; const before = (entry.before ?? {}) as Record<string, unknown>;
  const action = String(entry.action ?? ""); const table = String(entry.table_name ?? "");
  const eventTitles: Record<string,string> = { pago_confirmado: "Pago confirmado", pago_rechazado: "Pago rechazado", pedido_cancelado: "Pedido cancelado", inventario_merma: "Merma de inventario", inventario_ajuste: "Ajuste de inventario", inventario_reversion: "Reversión de inventario", devolucion_registrada: "Devolución registrada", descuento_aplicado: "Descuento aplicado" };
  const title = eventTitles[action] || (table === "payments" && after.status === "confirmado" ? "Pago confirmado" : `${tables[table] || "Registro administrativo"}${action === "INSERT" ? ": registro" : action === "DELETE" ? ": eliminación" : ": actualización"}`);
  const facts: string[] = []; const amount = after.amount ?? after.total ?? after.unit_cost;
  if (entry.entity_name || after.name || after.order_number) facts.push(String(entry.entity_name || after.name || `Pedido #${after.order_number}`));
  if (before.status && before.status !== after.status) facts.push(`Estado anterior: ${states[String(before.status)] || String(before.status)}`);
  const eventStatus = action === "pago_confirmado" ? "confirmado" : action === "pago_rechazado" ? "rechazado" : action === "pedido_cancelado" ? "cancelado" : after.status;
  if (eventStatus) facts.push(`Estado: ${states[String(eventStatus)] || String(eventStatus)}`);
  if (after.quantity !== undefined) facts.push(`Cantidad: ${Number(after.quantity).toLocaleString("es-BO", { maximumFractionDigits: 3 })}${entry.unit ? ` ${entry.unit}` : ""}`);
  if (amount !== undefined) facts.push(`${after.unit_cost !== undefined ? "Costo unitario" : "Monto"}: Bs ${Number(amount).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (after.key === "store_location") { const value = after.value as Record<string,unknown>; facts.push("Ubicación de la tienda"); if (value?.address) facts.push(`Dirección: ${value.address}`); if (value?.reference) facts.push(`Referencia: ${value.reference}`); }
  if (entry.reason) facts.push(`Motivo: ${entry.reason}`);
  return { title, facts, user: String(entry.user_name || "Sistema / usuario no disponible") };
}
