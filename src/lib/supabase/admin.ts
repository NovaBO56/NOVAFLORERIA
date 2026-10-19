import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  if (process.env.NOVA_VISUAL_PREVIEW === "true") throw new Error("Supabase is disabled in visual preview.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Faltan las variables de entorno administrativas de Supabase.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}