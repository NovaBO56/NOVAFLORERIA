import { createClient } from "@/lib/supabase/server";

export type UserRole = "administrador" | "empleado";

export type AuthProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
};

/**
 * Funciones puras de permisos. Úsalas tanto en la app como en los
 * tests: si cambia la regla de negocio, cambia en un solo lugar y
 * los tests lo detectan.
 */
export function canUseAdminFunctions(profile: AuthProfile): boolean {
  return profile.is_active && profile.role === "administrador";
}

export function canUseEmployeeFunctions(profile: AuthProfile): boolean {
  return (
    profile.is_active &&
    (profile.role === "empleado" || profile.role === "administrador")
  );
}

export async function getCurrentUserProfile(): Promise<AuthProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile as AuthProfile;
}

export async function requireActiveUser(): Promise<AuthProfile> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    throw new Error("Usuario no autenticado.");
  }

  if (!profile.is_active) {
    throw new Error("Usuario inactivo.");
  }

  return profile;
}

export async function requireAdmin(): Promise<AuthProfile> {
  const profile = await requireActiveUser();

  if (!canUseAdminFunctions(profile)) {
    throw new Error("Acceso exclusivo para administradores.");
  }

  return profile;
}

export async function requireEmployeeOrAdmin(): Promise<AuthProfile> {
  const profile = await requireActiveUser();

  if (!canUseEmployeeFunctions(profile)) {
    throw new Error("Rol de usuario no válido.");
  }

  return profile;
} 