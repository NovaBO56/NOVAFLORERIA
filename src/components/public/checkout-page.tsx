"use client";
import { phoneInput, PHONE_ERROR } from "@/lib/public/phone";
import { paymentNotice } from "@/lib/public/payment-notice";
import Link from "next/link";
import { SafeImage as Image } from "@/components/public/safe-image";
import { useEffect, useRef, useState } from "react";
import { clearCart, refreshCartItems, useCart } from "./home/cart";
import { checkoutDetailsSchema, orderPayload, publicRequest, requiresPayment, singleFlight, type CheckoutDetails } from "@/lib/public/checkout";
import { acceptingOrders, formatMoney, whatsappLink } from "@/lib/public/format";
import type { BusinessStatus, PublicOrder, PublicPromotion } from "@/lib/public/types";
import { OrderSummary } from "./order-summary";

type Recovery = { id: string; phone: string; name?: string };
const recoveryKey = "nova-checkout-order-v1";
const attemptKey = "nova-checkout-attempt-v1";
const inputClass = "mt-1 w-full rounded-xl border border-purple-200 bg-white p-3";
const buttonClass = "min-h-12 rounded-xl bg-[#65358e] px-5 py-3 font-bold text-white disabled:opacity-50";

export default function CheckoutPage() {
  const cart = useCart();
  const [details, setDetails] = useState<CheckoutDetails>({ customer_name: "", customer_phone: "", delivery: "retiro", address: "", notes: "", promotion_id: "" });
  const [meta, setMeta] = useState<{ status: BusinessStatus | null; promotions: PublicPromotion[]; whatsapp: string | null }>({ status: null, promotions: [], whatsapp: null });
  const [qr, setQr] = useState<{ qr_public_url: string; account_label: string | null } | null>(null);
  const [qrError, setQrError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [review, setReview] = useState(false);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const flight = useRef(singleFlight());
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(recoveryKey) || "null");
        if (saved && typeof saved.id === "string" && typeof saved.phone === "string" && active) setRecovery(saved);
        attempt.current = JSON.parse(sessionStorage.getItem(attemptKey) || "null");
      } catch { /* Storage is optional. */ }
      const results = await Promise.allSettled([
        publicRequest<{ status: BusinessStatus }>("/api/business-hours"),
        publicRequest<{ promotions: PublicPromotion[] }>("/api/promotions"),
        publicRequest<{ whatsapp: { phone_number: string } }>("/api/whatsapp-config"),
        publicRequest<{ qr: NonNullable<typeof qr> }>("/api/payment-qr"),
        refreshCartItems(),
      ]);
      if (!active) return;
      const [hours, promotions, whatsapp, paymentQr] = results;
      setMeta({ status: hours.status === "fulfilled" ? hours.value.status : null, promotions: promotions.status === "fulfilled" ? promotions.value.promotions : [], whatsapp: whatsapp.status === "fulfilled" ? whatsapp.value.whatsapp.phone_number : null });
      if (paymentQr.status === "fulfilled" && paymentQr.value.qr.qr_public_url) setQr(paymentQr.value.qr);
      else setQrError("El QR no está disponible. Coordina el pago con la tienda por WhatsApp.");
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!recovery) return;
    let active = true;
    publicRequest<{ order: PublicOrder }>("/api/orders/track", { order_id: recovery.id, customer_phone: recovery.phone }).then(data => { if (active) setOrder(data.order); }).catch(() => { if (active) setError("Tu pedido fue creado. No pudimos cargar el resumen; pulsa Actualizar pedido. No vuelvas a comprar para este mismo pedido."); });
    return () => { active = false; };
  }, [recovery]);

  function update(field: keyof CheckoutDetails, value: string) { setDetails(current => ({ ...current, [field]: value })); setReview(false); }
  async function refreshOrder() {
    if (!recovery) return;
    setOrder((await publicRequest<{ order: PublicOrder }>("/api/orders/track", { order_id: recovery.id, customer_phone: recovery.phone })).order);
  }
  async function run(action: () => Promise<void>) {
    await flight.current(async () => {
      setBusy(true); setError("");
      try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo completar la solicitud. Tu carrito se conserva."); } finally { setBusy(false); }
    });
  }
  async function createOrder() {
    await run(async () => {
      const fingerprint = JSON.stringify(orderPayload(cart.items, details, "preview"));
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      try { sessionStorage.setItem(attemptKey, JSON.stringify(attempt.current)); } catch { /* In-memory retry remains available. */ }
      const payload = orderPayload(cart.items, details, attempt.current.key);
      const result = await publicRequest<{ order_id: string }>("/api/orders", payload);
      if (!result.order_id) throw new Error("No se recibió la confirmación del pedido. Reintenta para recuperar el mismo pedido.");
      const saved = { id: result.order_id, phone: payload.customer_phone, name: payload.customer_name };
      try { sessionStorage.setItem(recoveryKey, JSON.stringify(saved)); sessionStorage.removeItem(attemptKey); } catch { /* Keep recovery in state. */ }
      setRecovery(saved);
      clearCart();
    });
  }
  const whatsapp = whatsappLink(meta.whatsapp, recovery ? `Hola Floristería Anabelle, necesito ayuda con mi pedido ${order ? `#${order.order_number}` : "recién creado"}.` : "Hola Floristería Anabelle, necesito ayuda para completar mi compra.");
  return <main className="nova-checkout nova-page min-h-screen bg-[#faf8fb] px-4 py-8 text-[#403344]">
    <div className="mx-auto max-w-4xl space-y-6 break-words">
      <nav className="flex flex-wrap gap-5"><Link href="/">← Volver a la tienda</Link><Link href="/seguimiento">Seguir un pedido</Link></nav>
      <ol aria-label="Progreso de compra" className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">{["Datos", "Entrega", "Pago", "Confirmación"].map((step,index) => <li key={step} aria-current={index === (order?.payment_status === "pendiente" || (order && Number(order.total) === 0) ? 3 : recovery ? 2 : review ? 1 : 0) ? "step" : undefined} className="rounded-xl border border-purple-200 bg-white p-3 aria-[current=step]:bg-purple-100 aria-[current=step]:font-bold">{index+1}. {step}</li>)}</ol>
      <h1 className="text-3xl font-bold">{recovery ? "Pedido creado" : "Finalizar compra"}</h1>
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">{error}</p> : null}
      {!ready ? <p role="status">Cargando tu compra…</p> : recovery ? <>
        {order ? <OrderSummary order={order} /> : <p>Recuperando el resumen del pedido…</p>}
        <button disabled={busy} onClick={() => void run(refreshOrder)} className={buttonClass}>Actualizar pedido</button>
        {order && Number(order.total) === 0 && !["cancelado", "rechazado"].includes(order.status) ? <p role="status">Pedido gratuito. No necesitas transferir ni reportar un pago. Puedes consultar su preparación en el seguimiento.</p> : null}
        {order && requiresPayment(order) ? <section className="space-y-4 rounded-2xl border bg-white p-5">
          <h2 className="text-xl font-bold">Pago por QR</h2>
          {qr ? <><p>Paga exactamente {formatMoney(order.total)} a {qr.account_label || "la cuenta de Floristería Anabelle"}.</p><Image unoptimized src={qr.qr_public_url} alt="QR de pago de Floristería Anabelle" width={320} height={320} className="nova-fade mx-auto max-w-full" /><a href={qr.qr_public_url} target="_blank" rel="noopener noreferrer" className="underline">Abrir QR para guardarlo</a><p>Después de realizar la transferencia, reporta tu pago. La confirmación depende de la revisión de la tienda.</p></> : <p>{qrError || "Cargando QR…"}</p>}
          {order.payment_status === "pendiente" ? <div role="status" className="space-y-3 rounded-xl bg-purple-50 p-4"><p>Pago reportado. Tu reserva se conserva mientras la tienda revisa la transferencia.</p>{meta.whatsapp ? <a className="inline-flex min-h-12 items-center rounded-xl bg-[#65358e] px-4 py-3 font-bold text-white" href={whatsappLink(meta.whatsapp, paymentNotice(order, recovery.name || "", recovery.phone))!} target="_blank" rel="noopener noreferrer">Avisar a la floristería por WhatsApp</a> : null}<p className="text-sm">El enlace abre WhatsApp con el resumen. Debes pulsar Enviar allí; el aviso no se envía automáticamente.</p></div> : qr ? <button disabled={busy} className={buttonClass} onClick={() => void run(async () => { if (!requiresPayment(order)) return; await publicRequest(`/api/orders/${recovery.id}/payment`, { customer_phone: recovery.phone }); await refreshOrder(); })}>{busy ? "Procesando…" : "Ya pagué: reportar pago"}</button> : null}
        </section> : null}
        <Link href="/seguimiento" className="block underline">Consultar el seguimiento con tu número y teléfono</Link>
        <button className="underline" disabled={busy || !order} onClick={() => { try { sessionStorage.removeItem(recoveryKey); } catch {} setRecovery(null); setOrder(null); setReview(false); attempt.current = null; }}>Comenzar otra compra</button>
      </> : cart.items.length === 0 ? <p>Tu carrito está vacío. <Link className="underline" href="/#catalogo">Ver catálogo</Link></p> : <form className="grid gap-5 md:grid-cols-[1.2fr_1fr] md:items-start" onSubmit={event => { event.preventDefault(); const parsed = checkoutDetailsSchema.safeParse(details); if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Revisa tus datos."); return; } if (!review) { setError(""); setReview(true); } else void createOrder(); }}>
        <fieldset disabled={busy} className="space-y-4 rounded-2xl border bg-white p-5">
          <legend className="font-bold">1. Datos · 2. Entrega</legend>
          <label className="block">Nombre<input required autoComplete="name" maxLength={200} className={inputClass} value={details.customer_name} onChange={event => update("customer_name", event.target.value)} /></label>
          <label className="block">Teléfono<input required type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{8}" minLength={8} maxLength={8} onInvalid={event => event.currentTarget.setCustomValidity(PHONE_ERROR)} onInput={event => event.currentTarget.setCustomValidity("")} className={inputClass} value={details.customer_phone} onChange={event => update("customer_phone", phoneInput(event.target.value))} /><span className="text-sm">8 dígitos, sin +591. Conserva este celular para consultar el pedido.</span></label>
          <label className="block">Método de entrega<select className={inputClass} value={details.delivery} onChange={event => update("delivery", event.target.value)}><option value="retiro">Retiro en tienda</option><option value="entrega">Entrega por coordinar</option></select></label>
          {details.delivery === "entrega" ? <><label className="block">Dirección y referencia<textarea required minLength={5} maxLength={400} autoComplete="street-address" className={inputClass} value={details.address} onChange={event => update("address", event.target.value)} /></label><p className="text-sm">Disponibilidad, horario y costo de envío se coordinan con la tienda. El total mostrado corresponde a los productos.</p></> : null}
          <label className="block">Notas<textarea maxLength={400} className={inputClass} value={details.notes} onChange={event => update("notes", event.target.value)} /></label>
          <label className="block">Promoción<select className={inputClass} value={details.promotion_id} onChange={event => update("promotion_id", event.target.value)}><option value="">Sin promoción</option>{meta.promotions.map(promotion => <option key={promotion.id} value={promotion.id}>{promotion.name}</option>)}</select></label>
          <p>Pago por QR con revisión de la tienda. Si el total definitivo es cero, no necesitarás pagar.</p>
        </fieldset>
        <section key={review ? "review" : "cart"} className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">{review ? "Revisa tu pedido" : "Resumen de compra"}</h2>{cart.items.map(item => <div key={item.id}><p>{item.quantity} × {item.name}: {formatMoney(item.price * item.quantity)}</p>{item.options?.map(option => <p key={option.id} className="text-sm">{option.name}</p>)}{item.message ? <p className="text-sm">Tarjeta: {item.message}</p> : null}</div>)}<p className="font-bold">Subtotal estimado: {formatMoney(cart.total)}</p><p className="text-sm">El servidor valida precios, stock y promoción al crear el pedido. Revisa el total definitivo antes de transferir.</p>{review ? <p>{details.customer_name} · {details.customer_phone} · {details.delivery === "retiro" ? "Retiro en tienda" : details.address}</p> : null}</section>
        {cart.hasUnavailable ? <p role="alert">Hay productos no disponibles. Revisa el carrito en la tienda.</p> : null}
        {!acceptingOrders(meta.status) ? <p role="alert">La tienda está cerrada y no acepta pedidos fuera de horario.</p> : null}
        <button className={buttonClass} disabled={busy || cart.hasUnavailable || !acceptingOrders(meta.status)}>{busy ? "Creando pedido…" : review ? "Confirmar y crear pedido" : "Revisar compra"}</button>
      </form>}
      {ready && (whatsapp ? <a className="block rounded-xl border border-purple-300 p-4 text-center font-bold" href={whatsapp} target="_blank" rel="noopener noreferrer">Necesito ayuda por WhatsApp</a> : <p className="text-sm">WhatsApp no está disponible en este momento. Consulta los datos de contacto de la tienda.</p>)}
    </div>
  </main>;
}
