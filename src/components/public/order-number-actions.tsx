"use client";
import { useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { downloadOrderGuide } from "@/lib/public/order-journey";
import type { PublicOrder } from "@/lib/public/types";

export function OrderNumberActions({ order }: { order: PublicOrder }) {
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function copy() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setCopied(false); setFeedback("");
    try {
      await navigator.clipboard.writeText(String(order.order_number));
      setCopied(true); setFeedback("Número de pedido copiado.");
    } catch { setFeedback("No pudimos copiar automáticamente. Selecciona el número que aparece arriba y cópialo desde tu dispositivo."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="customer-card customer-stack" aria-label="Guardar número de pedido">
    <p className="customer-kicker">Tu referencia de compra</p>
    <h3 className="text-2xl font-bold select-all break-all">Pedido #{order.order_number}</h3>
    <p className="customer-muted text-sm">Guarda tu número de pedido para consultar su estado cuando quieras. Necesitarás también el celular de tu compra.</p>
    <button type="button" disabled={busy} aria-busy={busy} className="customer-secondary" onClick={() => void copy()}>{copied ? <Check size={18} aria-hidden/> : <Copy size={18} aria-hidden/>}{busy ? "Copiando…" : copied ? "Número copiado" : "Copiar número"}</button>
    <button type="button" className="customer-secondary" onClick={() => { try { downloadOrderGuide(order); setFeedback("Archivo preparado con tu número e instrucciones de seguimiento."); } catch { setFeedback("No pudimos preparar el archivo. Conserva el número que aparece arriba."); } }}><Download size={18} aria-hidden/>Guardar mi número de pedido</button>
    {feedback && <p role="status" className="customer-note text-sm">{feedback}</p>}
  </section>;
}
