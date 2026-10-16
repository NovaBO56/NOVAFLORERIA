"use client";
import Link from "next/link";
import { Flower2, Home, ShoppingBag, Search, ArrowLeft, Store } from "lucide-react";
import type { ReactNode } from "react";
import { lato, script } from "./home/shared";

export function CustomerShell({ children, tracking = false }: { children: ReactNode; tracking?: boolean }) {
  return <main className={`customer-experience nova-checkout ${lato.className} ${tracking ? "customer-with-nav" : ""}`}>
    <header className="customer-header"><Link href="/" aria-label="Volver a la tienda" className="customer-back"><ArrowLeft size={20} /></Link><Link href="/" className="customer-brand"><Flower2 aria-hidden size={30}/><span>Floristería <strong className={script.className}>Anabelle</strong></span></Link><nav aria-label="Navegación de compra" className="customer-desktop-nav"><Link href="/#catalogo">Catálogo</Link><Link href="/checkout">Mi compra</Link><Link href="/seguimiento">Seguir pedido</Link></nav><Link href="/seguimiento" aria-label="Consultar un pedido" className="customer-back"><Search size={20}/></Link></header>
    <div className="customer-content">{children}</div>
    {tracking && <nav className="customer-bottom-nav" aria-label="Navegación principal"><Link href="/"><Home size={20}/>Inicio</Link><Link href="/#catalogo"><Store size={20}/>Catálogo</Link><Link href="/checkout"><ShoppingBag size={20}/>Mi compra</Link><Link href="/seguimiento" aria-current="page"><Search size={20}/>Seguimiento</Link></nav>}
  </main>;
}

export function WaitingFlower() {
  return <div className="waiting-flower" aria-hidden="true"><span/><Flower2 size={76} strokeWidth={1}/></div>;
}

export function CheckoutProgress({ step }: { step: number }) {
  return <ol className="customer-progress" aria-label="Progreso de compra">{["Tus datos", "Entrega", "Pago", "Confirmación"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} data-complete={index < step}><span>{index + 1}</span><small>{label}</small></li>)}</ol>;
}
