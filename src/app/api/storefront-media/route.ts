import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyStorefrontMedia, publicStorefrontMedia } from "@/lib/public/storefront-media";
export async function GET() {
  const { data, error } = await createAdminClient().from("system_settings").select("value").eq("key", "storefront_media").maybeSingle();
  if (error) return NextResponse.json({ success: false, message: "No se pudieron cargar las imágenes de la tienda." }, { status: 503 });
  return NextResponse.json({ success: true, media: data ? publicStorefrontMedia(data.value, process.env.NEXT_PUBLIC_SUPABASE_URL || "") : emptyStorefrontMedia });
}
