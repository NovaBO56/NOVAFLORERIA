import { Flower2 } from "lucide-react";
import type { AdminNavSection } from "@/config/admin-navigation";
import { AdminNavList } from "./admin-nav-list";

export function AdminBrand() {
  return (
    <div className="flex h-20 shrink-0 items-center gap-3 border-b border-border-decorative px-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm"><Flower2 aria-hidden="true" className="size-5 stroke-[1.7]" /></span>
      <div className="min-w-0"><span className="block text-sm font-bold leading-tight text-text">Floristería Anabelle</span><span className="mt-1 block text-xs text-text-secondary">Panel de control</span></div>
    </div>
  );
}

export function AdminSidebar({ sections }: { sections: AdminNavSection[] }) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] flex-col border-r border-border-decorative bg-surface lg:flex">

      <AdminNavList sections={sections} />
    </aside>
  );
}