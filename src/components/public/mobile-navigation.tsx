"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, Search, ShoppingBag, Store } from "lucide-react";

export function MobileNavigation({ tracking = false }: { tracking?: boolean }) {
  const [catalog, setCatalog] = useState(false);
  useEffect(() => {
    const update = () => setCatalog(window.location.hash === "#catalogo");
    update(); window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return <nav className="customer-bottom-nav" aria-label="Navegación principal móvil">
    <Link href="/" aria-current={!tracking && !catalog ? "page" : undefined}><Home size={20} aria-hidden/>Inicio</Link>
    <Link href="/#catalogo" aria-current={!tracking && catalog ? "location" : undefined}><Store size={20} aria-hidden/>Catálogo</Link>
    <Link href="/checkout"><ShoppingBag size={20} aria-hidden/>Mi compra</Link>
    <Link href="/seguimiento" aria-current={tracking ? "page" : undefined}><Search size={20} aria-hidden/>Seguimiento</Link>
  </nav>;
}
