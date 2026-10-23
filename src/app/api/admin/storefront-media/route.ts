import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeProductImage } from "@/lib/product-image-file";
import { uuidSchema } from "@/validations/database-values";

export async function POST(request: Request) {
  let actor: { id: string };
  try { actor = await requireAdmin(); } catch { return NextResponse.json({ success: false, message: "Acceso no autorizado." }, { status: 403 }); }
  try {
    const form = await request.formData();
    const kind = form.get("kind"), category = form.get("category_id"), file = form.get("file");
    if (!["logo", "about", "category"].includes(String(kind)) || !(file instanceof File) || file.size > 5 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type) || (kind === "category" && !uuidSchema.safeParse(category).success)) return NextResponse.json({ success: false, message: "Selecciona una imagen PNG, JPG o WebP de hasta 5 MB y un destino válido." }, { status: 400 });
    const admin = createAdminClient();
    if (kind === "category") {
      const { data, error } = await admin.from("categories").select("id").eq("id", category).maybeSingle();
      if (error) throw Error("No se pudo comprobar la categoría.");
      if (!data) return NextResponse.json({ success: false, message: "La categoría no existe." }, { status: 404 });
    }
    let bytes: Buffer;
    try { bytes = await optimizeProductImage(Buffer.from(await file.arrayBuffer()), file.type); } catch { return NextResponse.json({ success: false, message: "El archivo no es una imagen estática válida. Revisa formato, tamaño y dimensiones." }, { status: 400 }); }
    const path = `storefront/${kind}/${randomUUID()}.webp`;
    const { error: uploadError } = await admin.storage.from("product-images").upload(path, bytes, { contentType: "image/webp", upsert: false, cacheControl: "3600" });
    if (uploadError) throw Error("No se pudo subir la imagen.");
    const { error } = await admin.rpc("set_storefront_media", { p_kind: kind, p_category_id: kind === "category" ? category : null, p_path: path, p_actor: actor.id });
    if (error) return NextResponse.json({ success: false, message: "La imagen se subió, pero no pudo guardarse en la configuración. No se reemplazó la imagen anterior; revisa la migración pendiente antes de reintentar." }, { status: 503 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch { return NextResponse.json({ success: false, message: "No se pudo guardar la imagen. Intenta nuevamente." }, { status: 500 }); }
}
