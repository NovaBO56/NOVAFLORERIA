import { describe, expect, it } from "vitest";
import {
  canUseAdminFunctions,
  canUseEmployeeFunctions,
  type AuthProfile,
} from "@/lib/auth/permissions";

describe("Permisos por rol (código real de producción)", () => {
  const administrador: AuthProfile = {
    id: "admin-test",
    full_name: "Administrador de prueba",
    role: "administrador",
    is_active: true,
  };

  const empleado: AuthProfile = {
    id: "employee-test",
    full_name: "Empleado de prueba",
    role: "empleado",
    is_active: true,
  };

  const empleadoInactivo: AuthProfile = {
    id: "inactive-test",
    full_name: "Empleado inactivo",
    role: "empleado",
    is_active: false,
  };

  const adminInactivo: AuthProfile = {
    id: "inactive-admin-test",
    full_name: "Administrador inactivo",
    role: "administrador",
    is_active: false,
  };

  it("el administrador activo puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(administrador)).toBe(true);
  });

  it("el empleado activo NO puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(empleado)).toBe(false);
  });

  it("el empleado activo puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(empleado)).toBe(true);
  });

  it("el administrador activo puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(administrador)).toBe(true);
  });

  it("un empleado inactivo NO puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(empleadoInactivo)).toBe(false);
  });

  it("un empleado inactivo NO puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(empleadoInactivo)).toBe(false);
  });

  it("un administrador inactivo NO puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(adminInactivo)).toBe(false);
  });

  it("un administrador inactivo NO puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(adminInactivo)).toBe(false);
  });
});