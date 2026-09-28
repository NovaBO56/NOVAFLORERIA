import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Agrega `created_by_name` a filas de inventario.
 *
 * Por qué usa el cliente admin: la RLS de `profiles` solo deja a un empleado
 * leer su propio perfil, así que un join con la sesión del empleado devolvería
 * null para los movimientos de los demás. Aquí solo se leen `id` y `full_name`.
 *
 * IMPORTANTE: llamar SIEMPRE después de `requireEmployeeOrAdmin()`.
 */
export async function attachUserNames<T extends { created_by: string }>(
  rows: T[],
): Promise<Array<T & { created_by_name: string | null }>> {
  const ids = [...new Set(rows.map((row) => row.created_by))];

  if (ids.length === 0) {
    return rows.map((row) => ({ ...row, created_by_name: null }));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("id, full_name").in("id", ids);

  if (error) {
    console.error("Error resolviendo nombres de usuario del inventario:", error);
    return rows.map((row) => ({ ...row, created_by_name: null }));
  }

  const names = new Map<string, string | null>(
    (data ?? []).map((profile: { id: string; full_name: string | null }) => [profile.id, profile.full_name]),
  );

  return rows.map((row) => ({ ...row, created_by_name: names.get(row.created_by) ?? null }));
}