"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Flower2, LogOut, Package, Search } from "lucide-react";
import { Notifications } from "@/components/admin/notifications";
import { Button } from "@/components/ui/button";
import type { AdminNavSection } from "@/config/admin-navigation";
import type { UserRole } from "@/lib/auth/permissions";
import { AdminMobileNav } from "./admin-mobile-nav";
import { ProfileAvatar } from "./profile-avatar";
import { useSignOut } from "./use-sign-out";

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
        "admin-topbar sticky top-0 z-30 flex items-center gap-3 border-b border-border-decorative bg-surface px-4 transition-shadow duration-150 md:px-6",
        scrolled ? "shadow-sm" : "shadow-none",
      )}
    >
      <AdminMobileNav sections={sections} />

      <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-3 lg:w-[202px] lg:flex-none">
        <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm sm:grid">
          <Flower2 aria-hidden className="size-5" />
        </span>
        <span className="min-w-0">
          <strong className="block break-words text-sm leading-tight text-text">Floristería Anabelle</strong>
          <span className="mt-1 hidden text-xs text-text-secondary sm:block">Panel de administración</span>
        </span>
      </Link>

      <form action="/admin/pedidos" role="search" className="admin-global-search relative mx-auto hidden md:block">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
        <input
          name="buscar"
          aria-label="Buscar pedidos por número, cliente o teléfono"
          placeholder="Buscar por pedido, cliente o teléfono…"
          className="w-full border border-border-decorative bg-bg-admin pl-9 pr-3 outline-brand"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Button asChild variant="outline" size="sm" className="hidden text-brand xl:inline-flex">
          <Link href="/admin/productos"><Package aria-hidden />Productos</Link>
        </Button>
        <Notifications />
        <div className="flex items-center gap-3 border-l border-border-decorative pl-3">
          <ProfileAvatar name={name} />
          <div className="hidden max-w-36 min-w-0 sm:block">
            <p className="truncate text-sm font-semibold leading-tight text-text" title={name ?? undefined}>{name ?? "Sin nombre"}</p>
            <p className="mt-1 text-xs text-text-secondary">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={signOut} loading={pending} loadingText="" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut aria-hidden />
        </Button>
      </div>
    </header>
  );
}
