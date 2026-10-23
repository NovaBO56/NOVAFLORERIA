"use client";
import { BrandLogo, StorefrontMediaProvider } from "./storefront-media";
import Link from "next/link";
import { MobileNavigation } from "./mobile-navigation";
import { Flower2, Search, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { lato } from "./home/shared";

export function CustomerShell({ children, tracking = false }: { children: ReactNode; tracking?: boolean }) {
  return <StorefrontMediaProvider><main className={`customer-experience nova-checkout ${lato.className} ${tracking ? "customer-with-nav" : ""}`}>
    <header className="customer-header"><Link href="/" aria-label="Volver a la tienda" className="customer-back"><ArrowLeft size={20} /></Link><Link href="/" className="customer-brand"><BrandLogo className="h-12 max-w-[176px]"/></Link><nav aria-label="Navegación de compra" className="customer-desktop-nav"><Link href="/#catalogo">Catálogo</Link><Link href="/checkout">Mi compra</Link><Link href="/seguimiento">Seguir pedido</Link></nav><Link href="/seguimiento" aria-label="Consultar un pedido" className="customer-back"><Search size={20}/></Link></header>
    <div className="customer-content">{children}</div>
    {tracking && <MobileNavigation tracking/>}
  </main></StorefrontMediaProvider>;
}

export function WaitingFlower() {
  return <div className="waiting-flower" aria-hidden="true"><span/><Flower2 size={76} strokeWidth={1}/></div>;
}

export function CheckoutProgress({ step }: { step: number }) {
  return <ol className="customer-progress" aria-label="Progreso de compra">{["Tus datos", "Entrega", "Pago", "Confirmación"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} data-complete={index < step}><span>{index + 1}</span><small>{label}</small></li>)}</ol>;
}
