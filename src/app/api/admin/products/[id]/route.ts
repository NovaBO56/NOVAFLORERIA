import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateProductSchema } from "@/validations/products";

const productSelect =
  "id, name, description, price, category_id, occasion, season_id, is_featured, is_available, is_sold_out, catalog_order, is_active, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

// El frontend manda categoryId/isFeatured/isAvailable/isSoldOut/catalogOrder/isActive
// en camelCase. Normalizamos a snake_case antes de validar con Zod.
function normalizeBody(body: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...body };
  const aliasMap: Record<string, string> = {
    categoryId: "category_id",
    isFeatured: "is_featured",
    isAvailable: "is_available",
    isSoldOut: "is_sold_out",
    catalogOrder: "catalog_order",
    isActive: "is_active",
  };

  for (const [camel, snake] of Object.entries(aliasMap)) {
    if (camel in normalized && !(snake in normalized)) {
      normalized[snake] = normalized[camel];
    }
    delete normalized[camel];
  }

  return normalized;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de producto requerido." }, { status: 400 });
    }

    const rawBody = await request.json();

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json({ success: false, error: "Los datos enviados no son válidos." }, { status: 400 });
    }

    const result = updateProductSchema.safeParse(normalizeBody(rawBody));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Datos de producto inválidos." },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = { ...result.data };
    if (updateData.description !== undefined) {
      updateData.description = (updateData.description as string | null) || null;
    }
    if (updateData.occasion !== undefined) {
      updateData.occasion = (updateData.occasion as string | null) || null;
    }

    const supabase = await createClient();
    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select(productSelect)
      .single();

    if (error) {
      console.error("Error actualizando producto:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error en PATCH /api/admin/products/[id]:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    const isAuthError =
      message === "Usuario no autenticado." ||
      message === "Usuario inactivo." ||
      message === "Rol de usuario no válido.";

    return NextResponse.json({ success: false, error: message }, { status: isAuthError ? 403 : 500 });
  }
}