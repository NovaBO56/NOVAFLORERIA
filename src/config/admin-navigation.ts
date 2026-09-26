import type { UserRole } from "@/lib/auth/permissions";

/**
 * Navegación del panel de administración — Fase 15 §2.1 y §4.1 (permisos por rol).
 *
 * Solo datos y funciones puras (sin React), para poder probarlas en tests.
 * Los iconos se referencian por nombre; el componente cliente los traduce a Lucide.
 *
 * `available`: la pantalla ya existe. Las secciones aún no construidas quedan
 * declaradas aquí y no se muestran en el menú hasta que su flag pase a `true`.
 */
export type AdminIconName =
  | "dashboard"
  | "orders"
  | "sales"
  | "inventory"
  | "cash"
  | "products"
  | "categories"
  | "seasons"
  | "promotions"
  | "customers"
  | "reports"
  | "users"
  | "settings"
  | "audit";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: AdminIconName;
  roles: readonly UserRole[];
  available: boolean;
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: readonly AdminNavItem[];
};

const STAFF: readonly UserRole[] = ["administrador", "empleado"];
const ADMIN_ONLY: readonly UserRole[] = ["administrador"];

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    id: "operacion",
    label: "Operación",
    items: [
      { label: "Dashboard", href: "/admin", icon: "dashboard", roles: STAFF, available: true },
      { label: "Pedidos", href: "/admin/pedidos", icon: "orders", roles: STAFF, available: true },
      { label: "Ventas", href: "/admin/ventas", icon: "sales", roles: STAFF, available: true },
      { label: "Inventario", href: "/admin/inventario", icon: "inventory", roles: STAFF, available: false },
      { label: "Caja", href: "/admin/caja", icon: "cash", roles: STAFF, available: true },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    items: [
      { label: "Productos", href: "/admin/productos", icon: "products", roles: STAFF, available: true },
      { label: "Categorías", href: "/admin/categorias", icon: "categories", roles: STAFF, available: true },
      { label: "Temporadas", href: "/admin/temporadas", icon: "seasons", roles: STAFF, available: true },
      { label: "Promociones", href: "/admin/promociones", icon: "promotions", roles: STAFF, available: false },
    ],
  },
  {
    id: "gestion",
    label: "Gestión",
    items: [
      { label: "Clientes", href: "/admin/clientes", icon: "customers", roles: STAFF, available: false },
      { label: "Reportes", href: "/admin/reportes", icon: "reports", roles: STAFF, available: false },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    items: [
      { label: "Usuarios", href: "/admin/usuarios", icon: "users", roles: ADMIN_ONLY, available: true },
      { label: "Configuración", href: "/admin/configuracion", icon: "settings", roles: ADMIN_ONLY, available: false },
      { label: "Auditoría", href: "/admin/auditoria", icon: "audit", roles: ADMIN_ONLY, available: false },
    ],
  },
];

/** Secciones visibles para un rol: solo ítems disponibles y permitidos; sin secciones vacías. */
export function getNavSectionsForRole(role: UserRole): AdminNavSection[] {
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.available && item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

/** Destino de "volver al panel": el primer ítem visible para el rol. */
export function getAdminHomeHref(role: UserRole): string {
  return getNavSectionsForRole(role)[0]?.items[0]?.href ?? "/";
}

/** `/admin` solo se marca activo con coincidencia exacta; el resto, por prefijo de ruta. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}