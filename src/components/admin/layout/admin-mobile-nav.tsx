"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { AdminNavSection } from "@/config/admin-navigation";
import { AdminNavList } from "./admin-nav-list";
import { AdminBrand } from "./admin-sidebar";

export function AdminMobileNav({ sections }: { sections: AdminNavSection[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú" className="lg:hidden">
          <Menu aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1E1826]/40 duration-200 motion-reduce:animate-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="theme-admin fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border-decorative bg-surface text-text shadow-overlay outline-none duration-200 motion-reduce:animate-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
          <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>
          <Dialog.Description className="sr-only">
            Secciones del panel de administración
          </Dialog.Description>
          <AdminBrand />
          <AdminNavList sections={sections} onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}