"use client";
import { useEffect, useState } from "react";
import type { PublicOrder } from "@/lib/public/types";

/** At most one lookup per 45s while visible. Stop on failure/rate limit and
 * terminal states. A manual refresh remains available; no commercial writes.
 */
export function useOrderUpdates(order: PublicOrder | null, phone: string, onUpdate: (order: PublicOrder) => void, enabled = true) {
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null);
  const id = order?.id, status = order?.status, payment = order?.payment_status;
  useEffect(() => {
    if (!enabled || !id || !phone || ["cancelado", "rechazado", "finalizado"].includes(status ?? "") || ["rechazado", "reembolsado"].includes(payment ?? "")) return;
    const controller = new AbortController();
    let pending = false;
    const timer = setInterval(async () => {
      if (document.visibilityState !== "visible" || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: id, customer_phone: phone }), cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error();
        if (!controller.signal.aborted) { onUpdate(data.order); setNotice(null); }
      } catch {
        clearInterval(timer);
        if (!controller.signal.aborted) setNotice({ id, text: "La actualización automática se pausó. Usa Actualizar para consultar el estado real; conservamos la última información recibida." });
      } finally { pending = false; }
    }, 45_000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [id, status, payment, phone, onUpdate, enabled]);
  return notice?.id === id ? notice?.text : "";
}
