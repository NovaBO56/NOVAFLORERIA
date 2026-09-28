import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { reorderImagesSchema } from "@/validations/product-images";

type RouteContext = { params: Promise<{ id: string }> };

const IMAGE_SELECT =
  "id, product_id, storage_path, public_url, alt_text, sort_order, mime_type, width, height, file_size_bytes, created_at";

// PATCH /api/admin/products/[id]/images/reorder
// Body: { image_ids: string[] } — el orden del array pasa a ser sort_order.
// La primera imagen del array queda como "principal" (sort_order = 0).
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = reorderImagesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de orden inválidos." },
        { status: 400 },
      );
    }

    const { image_ids } = result.data;
    const supabase = await createClient();

    const { data: existingImages, error: fetchError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", id);

    if (fetchError) {
      console.error("Error verificando imágenes:", fetchError);
      return NextResponse.json({ success: false, message: "No se pudieron verificar las imágenes." }, { status: 500 });
    }

    const existingIds = new Set((existingImages ?? []).map((image) => image.id));
    const sentIds = new Set(image_ids);

    const allBelongToProduct = image_ids.every((imageId) => existingIds.has(imageId));
    const sameCount = existingIds.size === sentIds.size;

    if (!allBelongToProduct || !sameCount) {
      return NextResponse.json(
        { success: false, message: "Debes enviar exactamente las imágenes actuales del producto, sin repetir ni omitir ninguna." },
        { status: 400 },
      );
    }

    // Se actualiza una por una: no cambia stock ni dinero, así que no
    // hace falta una función atómica en Postgres para esto.
    for (let index = 0; index < image_ids.length; index += 1) {
      const { error: updateError } = await supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", image_ids[index])
        .eq("product_id", id);

      if (updateError) {
        console.error("Error reordenando imagen:", updateError);
        return NextResponse.json({ success: false, message: "No se pudo reordenar una de las imágenes." }, { status: 500 });
      }
    }

    const { data: images, error: finalError } = await supabase
      .from("product_images")
      .select(IMAGE_SELECT)
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    if (finalError) {
      console.error("Error obteniendo imágenes reordenadas:", finalError);
      return NextResponse.json({ success: false, message: "El orden se guardó, pero no se pudo confirmar." }, { status: 500 });
    }

    return NextResponse.json({ success: true, images: images ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}