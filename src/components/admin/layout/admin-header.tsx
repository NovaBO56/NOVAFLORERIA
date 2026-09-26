"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminNavSection } from "@/config/admin-navigation";
import type { UserRole } from "@/lib/auth/permissions";
import { AdminMobileNav } from "./admin-mobile-nav";
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
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 transition-colors duration-150 md:px-6 lg:px-8",
        scrolled
          ? "border-border-decorative bg-header-glass backdrop-blur-sm"
          : "border-transparent"
      )}
    >
      <AdminMobileNav sections={sections} />

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm leading-tight font-medium text-text">{name ?? "Sin nombre"}</p>
        </div>
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