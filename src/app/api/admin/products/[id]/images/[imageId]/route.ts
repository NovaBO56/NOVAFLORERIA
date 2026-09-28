import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateImageSchema } from "@/validations/product-images-detail";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

const IMAGE_SELECT =
  "id, product_id, storage_path, public_url, alt_text, sort_order, mime_type, width, height, file_size_bytes, created_at";

// Solo edita metadatos (alt_text). Para reordenar/cambiar la imagen
// principal se usa PATCH /images/reorder; para reemplazar el archivo
// hay que borrar y volver a subir (no hay "reemplazar" en el modelo).
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id, imageId } = await context.params;

    const body = await request.json();
    const result = updateImageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de imagen inválidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_images")
      .update({ alt_text: result.data.alt_text })
      .eq("id", imageId)
      .eq("product_id", id)
      .select(IMAGE_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Error actualizando imagen:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar la imagen." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { success: false, message: "La imagen no existe o no pertenece a este producto." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, image: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();

    const { id, imageId } = await context.params;
    const admin = createAdminClient();

    const { data: image, error: imageError } = await admin
      .from("product_images")
      .select("id, product_id, storage_path")
      .eq("id", imageId)
      .eq("product_id", id)
      .maybeSingle();

    if (imageError) {
      return NextResponse.json({ success: false, message: "No se pudo consultar la imagen." }, { status: 500 });
    }
    if (!image) {
      return NextResponse.json(
        { success: false, message: "La imagen no existe o no pertenece a este producto." },
        { status: 404 },
      );
    }

    const { error: storageError } = await admin.storage
      .from("product-images")
      .remove([image.storage_path]);

    if (storageError) {
      return NextResponse.json({ success: false, message: "No se pudo eliminar el archivo de Storage." }, { status: 500 });
    }

    const { error: deleteError } = await admin
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", id);

    if (deleteError) {
      return NextResponse.json({ success: false, message: "No se pudo eliminar el registro de la imagen." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Imagen eliminada correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No tienes permisos para eliminar imágenes.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}