import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { id, imageId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "No autenticado.",
      },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.is_active !== true ||
    profile.role !== "administrador"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "No tienes permisos para eliminar imágenes.",
      },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  const { data: image, error: imageError } = await admin
    .from("product_images")
    .select("id, product_id, storage_path")
    .eq("id", imageId)
    .eq("product_id", id)
    .maybeSingle();

  if (imageError) {
    return NextResponse.json(
      {
        success: false,
        message: "No se pudo consultar la imagen.",
      },
      { status: 500 },
    );
  }

  if (!image) {
    return NextResponse.json(
      {
        success: false,
        message: "La imagen no existe o no pertenece a este producto.",
      },
      { status: 404 },
    );
  }

  const { error: storageError } = await admin.storage
    .from("product-images")
    .remove([image.storage_path]);

  if (storageError) {
    return NextResponse.json(
      {
        success: false,
        message: "No se pudo eliminar el archivo de Storage.",
      },
      { status: 500 },
    );
  }

  const { error: deleteError } = await admin
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", id);

  if (deleteError) {
    return NextResponse.json(
      {
        success: false,
        message: "No se pudo eliminar el registro de la imagen.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Imagen eliminada correctamente.",
  });
}