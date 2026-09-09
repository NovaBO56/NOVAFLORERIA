
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "product-images";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_PRODUCT = 10;

const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const WEBP_QUALITY = 82;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "El ID del producto es obligatorio.",
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Debes seleccionar una imagen.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tipo de imagen no permitido. Solo se aceptan JPG, PNG y WebP.",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "La imagen está vacía.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "La imagen no puede superar los 5 MB.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (productError) {
      console.error(
        "Error verificando producto:",
        productError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo verificar el producto.",
        },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto no existe.",
        },
        { status: 404 },
      );
    }

    const { count, error: countError } = await supabase
      .from("product_images")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("product_id", id);

    if (countError) {
      console.error(
        "Error contando imágenes:",
        countError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo comprobar el límite de imágenes.",
        },
        { status: 500 },
      );
    }

    const currentImageCount = count ?? 0;

    if (currentImageCount >= MAX_IMAGES_PER_PRODUCT) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Este producto ya tiene el máximo de 10 imágenes.",
        },
        { status: 400 },
      );
    }

    const inputBuffer = Buffer.from(
      await file.arrayBuffer(),
    );

    let processedBuffer: Buffer;

    try {
      processedBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: MAX_IMAGE_WIDTH,
          height: MAX_IMAGE_HEIGHT,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: WEBP_QUALITY,
        })
        .toBuffer();
    } catch (error) {
      console.error(
        "Error procesando imagen:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo procesar la imagen.",
        },
        { status: 400 },
      );
    }

    let width: number | null = null;
    let height: number | null = null;

    try {
      const processedMetadata =
        await sharp(processedBuffer).metadata();

      width = processedMetadata.width ?? null;
      height = processedMetadata.height ?? null;
    } catch (error) {
      console.error(
        "Error obteniendo dimensiones de imagen:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "La imagen fue procesada, pero no se pudieron obtener sus dimensiones.",
        },
        { status: 400 },
      );
    }

    const uniqueName = `${crypto.randomUUID()}.webp`;
    const storagePath = `products/${id}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, processedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Error subiendo imagen:",
        uploadError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo subir la imagen.",
        },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    const { data: image, error: imageError } = await supabase
      .from("product_images")
      .insert({
        product_id: id,
        storage_path: storagePath,
        public_url: publicUrl,
        alt_text: file.name,
        sort_order: currentImageCount,
        mime_type: "image/webp",
        width,
        height,
        file_size_bytes: processedBuffer.length,
      })
      .select(
        "id, product_id, storage_path, public_url, alt_text, sort_order, mime_type, width, height, file_size_bytes, created_at",
      )
      .single();

    if (imageError) {
      console.error(
        "Error registrando imagen:",
        imageError,
      );

      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      return NextResponse.json(
        {
          success: false,
          message:
            "La imagen se subió, pero no pudo registrarse correctamente.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        image,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Error inesperado en subida de imagen:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo subir la imagen.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}
