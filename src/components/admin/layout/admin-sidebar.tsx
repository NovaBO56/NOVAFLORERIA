import { Flower2 } from "lucide-react";
import type { AdminNavSection } from "@/config/admin-navigation";
import { AdminNavList } from "./admin-nav-list";

export function AdminBrand() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border-decorative px-4">
      <Flower2 aria-hidden="true" className="size-6 stroke-[1.5] text-brand" />
      <span className="font-display text-lg font-semibold text-text">Nova Florería</span>
    </div>
  );
}

export function AdminSidebar({ sections }: { sections: AdminNavSection[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border-decorative bg-surface lg:flex">
      <AdminBrand />
      <AdminNavList sections={sections} />
    </aside>
  );
}