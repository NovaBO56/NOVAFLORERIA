import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (process.env.NEXT_PUBLIC_NOVA_VISUAL_PREVIEW === "true") throw new Error("Supabase is disabled in visual preview.");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}