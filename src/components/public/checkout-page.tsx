"use client";
import { clientId } from "@/lib/public/client-id";

import { paymentNotice } from "@/lib/public/payment-notice";
import { selectedPaymentQr, readPaymentQrSelection, savePaymentQrSelection, type PaymentQr, type QrSlot } from "@/lib/public/payment-qrs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearCart, refreshCartItems, useCart, useCartAvailability } from "./home/cart";
import { checkoutSessionKeys, readCheckoutDraft, reachedConfirmation, saveCheckoutDraft, hasCheckoutDraft, orderPayload, publicRequest, requiresPayment, singleFlight, type CheckoutDetails } from "@/lib/public/checkout";
import { CheckCircle2, ExternalLink, RotateCcw } from "lucide-react";
import { whatsappLink } from "@/lib/public/format";
import type { BusinessStatus, PublicOrder, PublicPromotion } from "@/lib/public/types";
import { OrderSummary } from "./order-summary";
import { CheckoutPayment } from "./checkout-payment";
import { CheckoutForm } from "./checkout-form";
import { CustomerShell, CheckoutProgress, WaitingFlower } from "./customer-shell";
import { OrderNumberActions } from "./order-number-actions";
import { useOrderUpdates } from "./use-order-updates";
import { getPromotionSelection, selectPromotion } from "@/lib/public/promotion-selection";
import { beginAnotherPurchase } from "@/lib/public/previous-purchase";
import { CheckoutPurchaseActions } from "./checkout-purchase-actions";

type Recovery = { id: string; phone: string; name?: string; confirmationReached?: boolean };
const { recovery: recoveryKey, attempt: attemptKey } = checkoutSessionKeys;
const emptyDetails: CheckoutDetails = { customer_name: "", customer_phone: "", delivery: "retiro", address: "", reference: "", notes: "", promotion_id: "" };

const buttonClass = "customer-primary";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails);
  const [meta, setMeta] = useState<{ status: BusinessStatus | null; promotions: PublicPromotion[]; whatsapp: string | null }>({ status: null, promotions: [], whatsapp: null });
  const [qrs, setQrs] = useState<PaymentQr[]>([]);
  const [qrSlot, setQrSlot] = useState<QrSlot | null>(null);

  const [qrError, setQrError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);

  const [recovery, setRecovery] = useState<Recovery | null>(null);
  useCartAvailability(ready && !recovery && !busy && !attemptStarted);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const updateNotice = useOrderUpdates(order, recovery?.phone ?? "", setOrder, !busy);
  const qr = order?.reported_qr ?? selectedPaymentQr(qrs, qrSlot);
  const flight = useRef(singleFlight());
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const reporting = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (recovery) resultHeading.current?.focus(); }, [recovery]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(recoveryKey) || "null");
        if (saved && typeof saved.id === "string" && typeof saved.phone === "string" && active) { setRecovery(saved); setQrSlot(readPaymentQrSelection(sessionStorage, saved.id)); }
        if (!saved && active) { const draft = readCheckoutDraft(sessionStorage); setDetails({ ...(draft ?? emptyDetails), promotion_id: getPromotionSelection() ?? draft?.promotion_id ?? "" }); }
        attempt.current = JSON.parse(sessionStorage.getItem(attemptKey) || "null");
        if (attempt.current && active) setAttemptStarted(true);
      } catch { /* Storage is optional. */ }
      const results = await Promise.allSettled([
        publicRequest<{ status: BusinessStatus }>("/api/business-hours"),
        publicRequest<{ promotions: PublicPromotion[] }>("/api/promotions"),
        publicRequest<{ whatsapp: { phone_number: string } }>("/api/whatsapp-config"),
        publicRequest<{ qrs: PaymentQr[] }>("/api/payment-qr"),
        // An uncertain previous submit must recover its own reservation using
        // the same idempotency key, rather than treating it as somebody else's stock.
        attempt.current ? Promise.resolve() : refreshCartItems(),
      ]);
      if (!active) return;
      const [hours, promotions, whatsapp, paymentQr] = results;
      setMeta({ status: hours.status === "fulfilled" ? hours.value.status : null, promotions: promotions.status === "fulfilled" ? promotions.value.promotions : [], whatsapp: whatsapp.status === "fulfilled" ? whatsapp.value.whatsapp.phone_number : null });
      if (paymentQr.status === "fulfilled" && paymentQr.value.qrs.length) setQrs(paymentQr.value.qrs);
      else setQrError("El QR no está disponible. Coordina el pago con la tienda por WhatsApp.");
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!recovery) return;
    let active = true;
    publicRequest<{ order: PublicOrder }>("/api/orders/track", { order_id: recovery.id, customer_phone: recovery.phone }).then(data => { if (!active) return; setOrder(data.order); if (!recovery.confirmationReached && reachedConfirmation(data.order)) { const saved = { ...recovery, confirmationReached: true }; try { sessionStorage.setItem(recoveryKey, JSON.stringify(saved)); } catch { /* Optional storage. */ } setRecovery(saved); } }).catch(() => { if (active) setError("Tu pedido fue creado. No pudimos cargar el resumen; pulsa Actualizar pedido. No vuelvas a comprar para este mismo pedido."); });
    return () => { active = false; };
  }, [recovery]);

  useEffect(() => {
    if (ready && !recovery) {
      if (hasCheckoutDraft(details)) saveCheckoutDraft(sessionStorage, details);
      else { try { sessionStorage.removeItem(checkoutSessionKeys.draft); } catch { /* Optional storage. */ } }
    }
  }, [details, ready, recovery]);

  function update(field: keyof CheckoutDetails, value: string) { if (field === "promotion_id") selectPromotion(value); setDetails(current => ({ ...current, [field]: value })); }
  function startAnotherPurchase() {
    if (busy || !order || !recovery) return;
    if (!beginAnotherPurchase(sessionStorage, { id: order.id, number: Number(order.order_number), phone: recovery.phone })) {
      setError("No pudimos guardar el seguimiento anterior. Conserva tu número de pedido antes de salir e intenta nuevamente."); return;
    }
    clearCart(); setRecovery(null); setOrder(null); setQrSlot(null); setDetails(emptyDetails); setError(""); attempt.current = null; setAttemptStarted(false);
    router.push("/#catalogo");
  }
  async function refreshOrder() {
    if (!recovery) return;
    const next = (await publicRequest<{ order: PublicOrder }>("/api/orders/track", { order_id: recovery.id, customer_phone: recovery.phone })).order;
    setOrder(next);
    if (!recovery.confirmationReached && reachedConfirmation(next)) { const saved = { ...recovery, confirmationReached: true }; try { sessionStorage.setItem(recoveryKey, JSON.stringify(saved)); } catch { /* Optional storage. */ } setRecovery(saved); }
  }
  async function run(action: () => Promise<void>) {
    await flight.current(async () => {
      setBusy(true); setError("");
      try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo completar la solicitud. Tu carrito se conserva."); } finally { setBusy(false); }
    });
  }
  async function createOrder() {
    await run(async () => {
      setAttemptStarted(true);
      const fingerprint = JSON.stringify(orderPayload(cart.items, details, "preview"));
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: clientId() };
      try { sessionStorage.setItem(attemptKey, JSON.stringify(attempt.current)); } catch { /* In-memory retry remains available. */ }
      const payload = orderPayload(cart.items, details, attempt.current.key);
      let result: { order_id: string };
      try {
        result = await publicRequest<{ order_id: string }>("/api/orders", payload);
      } catch (cause) {
        if (cause instanceof Error && /suficiente stock|producto ya no está disponible/.test(cause.message)) {
          await refreshCartItems();
          setAttemptStarted(false);
        }
        if (cause instanceof Error && cause.message.includes("entrega a domicilio está temporalmente no disponible")) {
          const hours = await publicRequest<{ status: BusinessStatus }>("/api/business-hours");
          setMeta(current => ({ ...current, status: hours.status }));
        }
        throw cause;
      }
      if (!result.order_id) throw new Error("No se recibió la confirmación del pedido. Reintenta para recuperar el mismo pedido.");
      const saved = { id: result.order_id, phone: payload.customer_phone, name: payload.customer_name };
      try { sessionStorage.setItem(recoveryKey, JSON.stringify(saved)); sessionStorage.removeItem(attemptKey); sessionStorage.removeItem(checkoutSessionKeys.draft); } catch { /* Keep recovery in state. */ }
      setRecovery(saved);
      clearCart();
    });
  }
  async function reportPayment() {
    if (reporting.current || busy || !order || !recovery || !requiresPayment(order) || !qr) return;
    reporting.current = true;
    // Open from the click while browsers still permit a popup; never send a message.
    const target = meta.whatsapp ? whatsappLink(meta.whatsapp, paymentNotice(order, recovery.name || "", recovery.phone)) : null;
    const popup = target ? window.open("about:blank", "_blank") : null;
    if (popup) popup.opener = null;
    let opened = false;
    try { await run(async () => {
      try {
        const result = await publicRequest<{ payment: { qr_label: string } }>(`/api/orders/${recovery.id}/payment`, { customer_phone: recovery.phone, qr_slot: qr.qr_slot });
        const target = whatsappLink(meta.whatsapp, paymentNotice(order, recovery.name || "", recovery.phone, result.payment.qr_label));
        // Persist the milestone even if the subsequent summary request fails.
        const saved = { ...recovery, confirmationReached: true };
        try { sessionStorage.setItem(recoveryKey, JSON.stringify(saved)); } catch { /* Optional storage. */ }
        setRecovery(saved);
        if (popup && target) { popup.location.href = target; opened = true; }
        await refreshOrder();
      } catch (cause) { if (popup && !opened) popup.close(); throw cause; }
    }); } finally { reporting.current = false; }
  }
  const whatsapp = whatsappLink(meta.whatsapp, recovery ? `Hola Floristería Anabelle, necesito ayuda con mi pedido ${order ? `#${order.order_number}` : "recién creado"}.` : "Hola Floristería Anabelle, necesito ayuda para completar mi compra.");
  return <CustomerShell>
    {recovery && <><CheckoutProgress step={order && reachedConfirmation(order) ? 3 : 2}/><div className="customer-title"><p className="customer-kicker">Cada detalle cuenta · Floristería Anabelle</p><h1 ref={resultHeading} tabIndex={-1} className="focus:outline-none">{order?.payment_status === "pendiente" ? "Pago reportado" : "Tu pedido, en buenas manos"}</h1><p>{order ? `Pedido #${order.order_number} · ` : ""}Conserva tu número para consultar el estado cuando quieras.</p></div></>}
    {error && <p role="alert" className="customer-error mb-5">{error}</p>}{updateNotice && <p role="status" className="customer-note mb-5">{updateNotice}</p>}
    {!ready ? <div className="customer-card" role="status">Preparando tu compra…</div> : recovery ? <div className="customer-stack">
      {order && <CheckoutPurchaseActions number={Number(order.order_number)} confirmed={reachedConfirmation(order)} disabled={busy} onStart={startAnotherPurchase}/>}
      <div className="customer-columns"><div className="customer-stack">
        {order?.payment_status === "pendiente" && order.status === "pendiente_pago" ? <section className="customer-waiting" role="status"><WaitingFlower/><h2>¡Recibimos tu aviso de pago!</h2><p className="mt-3">Nuestro equipo está revisando tu pago. Te mostraremos aquí cualquier novedad; también puedes pulsar Actualizar pedido.</p><p className="customer-note mt-5">Pedido #{order.order_number} · Esperando confirmación del local</p><p className="customer-muted mt-4 text-sm">El aviso no confirma el pago. WhatsApp requiere que tú pulses Enviar.</p>{meta.whatsapp && <a className="customer-secondary mt-5" href={whatsappLink(meta.whatsapp, paymentNotice(order, recovery.name || "", recovery.phone, order.reported_qr?.account_label))!} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden/>Enviar aviso por WhatsApp</a>}</section> : null}
        {order && Number(order.total) === 0 && ["confirmado", "en_preparacion", "listo", "finalizado"].includes(order.status) && <section className="customer-card customer-confirmed"><CheckCircle2 aria-hidden className="mb-3 text-[#53705b]"/><h2>Tu pedido gratuito está confirmado</h2><p className="mt-3">No necesitas transferir ni reportar un pago. Consulta su preparación en el seguimiento.</p></section>}
        {order && requiresPayment(order) && order.payment_status !== "pendiente" ? <CheckoutPayment total={Number(order.total)} qrs={qrs} selected={qr} whatsappAvailable={Boolean(meta.whatsapp)} error={qrError} busy={busy} reported={false} onSelect={slot => { setQrSlot(slot); savePaymentQrSelection(sessionStorage, recovery.id, slot); }} onReport={() => void reportPayment()}/> : null}
        <div className="customer-actions"><button disabled={busy} onClick={() => void run(refreshOrder)} className="customer-secondary"><RotateCcw size={18} aria-hidden/>Actualizar pedido</button></div>
      </div><aside className="customer-summary customer-stack">{order ? <OrderSummary order={order} checkout/> : <p role="status">Recuperando el pedido…</p>}{order && <OrderNumberActions key={order.id} order={order}/>}</aside></div>
      <div className="customer-actions"><Link href="/" className="customer-secondary">Volver a la tienda</Link></div>
    </div> : cart.items.length === 0 ? <section className="customer-card text-center"><h1>Un detalle especial te espera</h1><p className="customer-muted my-4">Tu carrito está vacío. Explora nuestras flores para comenzar.</p><Link className={buttonClass} href="/#catalogo">Ver catálogo</Link></section> : <CheckoutForm details={details} update={update} items={cart.items} total={cart.total} unavailable={cart.hasUnavailable} busy={busy} status={meta.status} promotions={meta.promotions} createOrder={createOrder}/>}
    {ready && <div className="mt-8 text-center">{whatsapp ? <a className="text-sm font-bold text-[#604581] underline" href={whatsapp} target="_blank" rel="noopener noreferrer">Necesito ayuda por WhatsApp</a> : <p className="customer-muted text-sm">WhatsApp no está disponible. Consulta los datos de contacto de la tienda.</p>}</div>}
  </CustomerShell>;
}
