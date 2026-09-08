
import { describe, expect, it } from "vitest";

type UserRole = "administrador" | "empleado";

type AuthProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
};

function canUseAdminFunctions(profile: AuthProfile): boolean {
  return profile.is_active && profile.role === "administrador";
}

function canUseEmployeeFunctions(profile: AuthProfile): boolean {
  return (
    profile.is_active &&
    (profile.role === "empleado" || profile.role === "administrador")
  );
}

describe("Permisos por rol", () => {
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

  it("el administrador activo puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(administrador)).toBe(true);
  });

  it("el empleado activo no puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(empleado)).toBe(false);
  });

  it("el empleado activo puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(empleado)).toBe(true);
  });

  it("el administrador activo puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(administrador)).toBe(true);
  });

  it("un usuario inactivo no puede usar funciones normales", () => {
    expect(canUseEmployeeFunctions(empleadoInactivo)).toBe(false);
  });

  it("un usuario inactivo no puede usar funciones administrativas", () => {
    expect(canUseAdminFunctions(empleadoInactivo)).toBe(false);
  });
});
