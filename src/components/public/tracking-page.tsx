"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { trackOrderSchema } from "@/validations/public-catalog";
import { publicRequest, singleFlight } from "@/lib/public/checkout";
import type { PublicOrder } from "@/lib/public/types";
import { OrderSummary } from "./order-summary";
export default function TrackingPage() {
  const [number, setNumber] = useState(""); const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const flight = useRef(singleFlight());
  return <main className="min-h-screen bg-[#faf8fb] px-4 py-8 text-[#403344]"><div className="mx-auto max-w-2xl space-y-6"><Link href="/">← Volver a la tienda</Link><h1 className="text-3xl font-bold">Seguimiento de tu pedido</h1><p>Ingresa el número de pedido y el teléfono usado al comprar.</p><form className="space-y-4 rounded-2xl border bg-white p-5" onSubmit={event => { event.preventDefault(); void flight.current(async () => {
    setError(""); setOrder(null); const parsed = trackOrderSchema.safeParse({ order_number: number, customer_phone: phone });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Revisa tus datos."); return; }
    setBusy(true); try { setOrder((await publicRequest<{ order: PublicOrder }>("/api/orders/track", parsed.data)).order); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo consultar el pedido."); } finally { setBusy(false); }
  }); }}><label className="block">Número de pedido<input disabled={busy} required inputMode="numeric" value={number} onChange={event => { setNumber(event.target.value); setOrder(null); }} className="mt-1 w-full rounded-xl border p-3" /></label><label className="block">Teléfono<input disabled={busy} required type="tel" autoComplete="tel" minLength={6} maxLength={30} value={phone} onChange={event => { setPhone(event.target.value); setOrder(null); }} className="mt-1 w-full rounded-xl border p-3" /></label><button disabled={busy} className="min-h-12 rounded-xl bg-[#65358e] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Consultando…" : "Consultar estado"}</button></form>{error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">{error}</p> : null}{order ? <OrderSummary order={order} /> : null}</div></main>;
}
