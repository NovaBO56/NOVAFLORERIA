import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV_SECTIONS,
  getAdminHomeHref,
  getNavSectionsForRole,
  isNavItemActive,
} from "@/config/admin-navigation";

const labels = (role: "administrador" | "empleado") =>
  getNavSectionsForRole(role).flatMap((section) => section.items.map((item) => item.label));

describe("Navegación del admin por rol (Fase 15 §4.1)", () => {
  it("el empleado no ve Usuarios, Configuración ni Auditoría", () => {
    const visibles = labels("empleado");
    expect(visibles).not.toContain("Usuarios");
    expect(visibles).not.toContain("Configuración");
    expect(visibles).not.toContain("Auditoría");
  });

  it("el administrador ve Usuarios además del catálogo", () => {
    const visibles = labels("administrador");
    expect(visibles).toContain("Usuarios");
    expect(visibles).toContain("Productos");
  });

  it("no muestra ítems cuya pantalla todavía no existe", () => {
    for (const role of ["administrador", "empleado"] as const) {
      for (const section of getNavSectionsForRole(role)) {
        expect(section.items.every((item) => item.available)).toBe(true);
      }
    }
    expect(labels("administrador")).not.toContain("Inventario");
  });

  it("no devuelve secciones vacías", () => {
    const secciones = getNavSectionsForRole("empleado");
    expect(secciones.every((section) => section.items.length > 0)).toBe(true);
    expect(secciones.map((section) => section.id)).not.toContain("administracion");
  });

  it("todos los href son únicos", () => {
    const hrefs = ADMIN_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("el destino de inicio es el primer ítem visible del rol", () => {
    expect(getAdminHomeHref("empleado")).toBe("/admin");
    expect(getAdminHomeHref("administrador")).toBe("/admin");
  });

  it("marca activo el ítem correcto", () => {
    expect(isNavItemActive("/admin/productos", "/admin/productos")).toBe(true);
    expect(isNavItemActive("/admin/productos/123", "/admin/productos")).toBe(true);
    expect(isNavItemActive("/admin/productos-x", "/admin/productos")).toBe(false);
    expect(isNavItemActive("/admin/productos", "/admin")).toBe(false);
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
  });
});