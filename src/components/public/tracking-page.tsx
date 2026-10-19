"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { trackOrderSchema } from "@/validations/public-catalog";
import { checkoutSessionKeys, publicRequest, singleFlight } from "@/lib/public/checkout";
import { OrderNumberActions } from "./order-number-actions";
import { useOrderUpdates } from "./use-order-updates";
import type { PublicOrder } from "@/lib/public/types";
import { OrderSummary } from "./order-summary";
import { CustomerShell } from "./customer-shell";

export default function TrackingPage() {
  const [number, setNumber] = useState(""); const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);
  const resultHeading = useRef<HTMLDivElement>(null);
  const flight = useRef(singleFlight());
  const updateNotice = useOrderUpdates(order, phone, setOrder, !busy);
  const recoveryRequest = useRef<AbortController | null>(null);
  // Recover the existing session credential, but always ask the server for the current state.
  useEffect(() => {
    const controller = new AbortController(); recoveryRequest.current = controller;
    try {
      const saved = JSON.parse(sessionStorage.getItem(checkoutSessionKeys.recovery) || "null");
      const parsed = trackOrderSchema.safeParse({ order_id: saved?.id, customer_phone: saved?.phone });
      if (!parsed.success) return;
      void fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store", signal: controller.signal }).then(async response => {
        const data = await response.json(); if (!response.ok || !data.success) throw Error(data.message || "No se pudo recuperar el pedido.");
        if (!controller.signal.aborted) { setOrder(data.order); setNumber(String(data.order.order_number)); setPhone(saved.phone); setUpdated(new Date().toLocaleTimeString("es-BO")); requestAnimationFrame(() => resultHeading.current?.focus()); }
      }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Consulta nuevamente tu pedido."); });
    } catch { /* Manual lookup remains available when session storage is unavailable. */ }
    return () => controller.abort();
  }, []);
  function query() { void flight.current(async () => {
    recoveryRequest.current?.abort(); setError(""); const parsed = trackOrderSchema.safeParse({ order_number: number, customer_phone: phone });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Revisa tus datos."); return; }
    setBusy(true); try { setOrder((await publicRequest<{ order: PublicOrder }>("/api/orders/track", parsed.data)).order); setUpdated(new Date().toLocaleTimeString("es-BO")); } catch (cause) { setOrder(null); setError(cause instanceof Error ? cause.message : "No se pudo consultar el pedido."); } finally { setBusy(false); }
  }); }
  return <CustomerShell tracking><div className="customer-title"><p className="customer-kicker">Flores que acompañan tus momentos</p><h1>Estado de tu pedido</h1><p>De nuestra florería a tus manos. Consulta cada etapa con tu número y celular.</p></div><div className="customer-columns"><div className="customer-stack focus:outline-none" ref={resultHeading} tabIndex={order ? -1 : undefined} aria-label={order ? "Resultado de seguimiento" : undefined}>{order ? <OrderSummary order={order}/> : <section className="customer-card"><Search className="text-[#74599f] mb-4" size={32} aria-hidden/><h2>Encuentra tu pedido</h2><p className="customer-muted mt-3">Usa los datos de tu compra, también desde otro dispositivo. Aquí verás el estado que confirme la tienda.</p></section>}</div><aside className="customer-summary customer-stack"><form className="customer-card customer-stack" onSubmit={event => { event.preventDefault(); query(); }}><h2>{order ? "Consultar / actualizar" : "Datos de seguimiento"}</h2><label className="customer-field">Número de pedido<input disabled={busy} required inputMode="numeric" value={number} onChange={event => { recoveryRequest.current?.abort(); setNumber(event.target.value); setOrder(null); }} placeholder="Ej. 123"/></label><label className="customer-field">Celular de la compra<input disabled={busy} required type="tel" inputMode="tel" autoComplete="tel" minLength={6} maxLength={30} value={phone} onChange={event => { recoveryRequest.current?.abort(); setPhone(event.target.value); setOrder(null); }}/></label><button disabled={busy} className="customer-primary"><RotateCcw size={18} aria-hidden/>{busy ? "Consultando…" : order ? "Actualizar estado" : "Consultar estado"}</button><p className="customer-muted text-sm">No publicamos los datos de otros pedidos. Necesitas el número y el celular utilizados al comprar.</p>{updated && order && <p className="text-xs customer-muted" role="status">Última consulta manual: {updated}. Actualizamos cada 45 segundos mientras esta página está visible; también puedes pulsar Actualizar.</p>}</form>{error && <p role="alert" className="customer-error">{error}</p>}{updateNotice && order && <p className="customer-note" role="status">{updateNotice}</p>}{order && <OrderNumberActions key={order.id} order={order}/>}</aside></div></CustomerShell>;
}
