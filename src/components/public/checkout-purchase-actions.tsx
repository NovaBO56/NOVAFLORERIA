"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function CheckoutPurchaseActions({ number, confirmed, disabled, onStart }: { number: number; confirmed: boolean; disabled: boolean; onStart: () => void }) {
  return <section className="customer-card mb-5" aria-label="Continuar después de tu pedido">
    <div className="customer-actions">
      <button type="button" className={confirmed ? "customer-primary" : "customer-secondary"} disabled={disabled} onClick={onStart}><ShoppingBag size={18} aria-hidden/>Hacer otra compra</button>
      <Link href="/seguimiento" className={confirmed ? "customer-secondary" : "customer-primary"}>Seguir mi pedido #{number}</Link>
    </div>
    <p className="customer-muted mt-3 text-sm">Tu pedido #{number} se conserva para seguimiento en esta sesión. Otra compra comienza con un carrito vacío; no cancela ni cambia este pedido.</p>
  </section>;
}
