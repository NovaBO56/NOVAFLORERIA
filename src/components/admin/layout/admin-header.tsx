"use client";

import { useEffect, useState } from "react";
import { Notifications } from "@/components/admin/notifications";
import { Flower2, LogOut, Package, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminNavSection } from "@/config/admin-navigation";
import type { UserRole } from "@/lib/auth/permissions";
import { AdminMobileNav } from "./admin-mobile-nav";
import { useSignOut } from "./use-sign-out";
import { ProfileAvatar } from "./profile-avatar";

const ROLE_LABEL: Record<UserRole, string> = {
  administrador: "Administrador",
  empleado: "Empleado",
};

type AdminHeaderProps = {
  name: string | null;
  role: UserRole;
  sections: AdminNavSection[];
};

export function AdminHeader({ name, role, sections }: AdminHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { signOut, pending } = useSignOut();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-decorative bg-surface px-4 transition-shadow duration-150 md:px-6 lg:px-8",
        scrolled
          ? "shadow-sm"
          : "shadow-none"
      )}
    >
      <AdminMobileNav sections={sections} />

      <Link href="/admin" className="hidden shrink-0 items-center gap-3 lg:flex lg:w-64"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-sm"><Flower2 aria-hidden className="size-5" /></span><span><strong className="block text-sm text-text">Floristería Anabelle</strong><span className="block text-[11px] text-text-secondary">Panel de administración</span></span></Link>
      <form action="/admin/pedidos" className="relative hidden min-w-0 flex-1 md:block lg:mx-auto lg:max-w-md"><Search aria-hidden className="absolute left-3 top-3 size-4 text-text-secondary" /><input name="buscar" aria-label="Buscar pedidos por número, cliente o teléfono" placeholder="Buscar por pedido, cliente o teléfono…" className="h-10 w-full rounded-xl border border-border-decorative bg-bg-admin pl-9 pr-3 text-xs" /></form>
      <Link href="/admin/productos" className="hidden items-center gap-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-2 text-xs font-semibold text-brand xl:flex"><Package aria-hidden className="size-4" />Productos</Link>
      <div className="ml-auto flex items-center gap-3">
        <ProfileAvatar name={name} />
        <div className="hidden text-right sm:block">
          <p className="text-sm leading-tight font-medium text-text">{name ?? "Sin nombre"}</p>
        </div>
        <Notifications />
        <Badge variant="outline">{ROLE_LABEL[role]}</Badge>
        <Button variant="ghost" size="sm" onClick={signOut} loading={pending} loadingText="Saliendo…">
          <LogOut aria-hidden="true" />
          <span className="hidden sm:inline">Cerrar sesión</span>
          <span className="sr-only sm:hidden">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}