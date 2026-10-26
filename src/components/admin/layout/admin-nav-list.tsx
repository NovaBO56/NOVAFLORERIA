"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  Package,
  Percent,
  Receipt,
  ScrollText,
  Settings,
  Tags,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import {
  isNavItemActive,
  type AdminIconName,
  type AdminNavSection,
} from "@/config/admin-navigation";

const ICONS: Record<AdminIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  sales: Receipt,
  inventory: Boxes,
  cash: Wallet,
  products: Package,
  categories: Tags,
  seasons: CalendarDays,
  promotions: Percent,
  customers: Users,
  reports: ChartColumn,
  users: UserCog,
  settings: Settings,
  audit: ScrollText,
};

type AdminNavListProps = {
  sections: AdminNavSection[];
  onNavigate?: () => void;
};

export function AdminNavList({ sections, onNavigate }: AdminNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación del panel" className="flex-1 overflow-y-auto px-3 py-2">
      {sections.map((section) => (
        <div key={section.id} className="pb-2">
          <p className="px-3 pt-5 pb-2 text-[11px] leading-[1.4] font-semibold tracking-[0.08em] text-text-secondary uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isNavItemActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                      active
                        ? "bg-brand-soft text-brand"
                        : "text-text hover:bg-brand-soft"
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0 stroke-[1.7]" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}