
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
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
          error: "ID de producto requerido.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Los datos enviados no son válidos.",
        },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    /*
     * NOMBRE
     */
    if ("name" in body) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 200
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "El nombre del producto no es válido.",
          },
          { status: 400 },
        );
      }

      updateData.name = body.name.trim();
    }

    /*
     * DESCRIPCIÓN
     */
    if ("description" in body) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La descripción no es válida.",
          },
          { status: 400 },
        );
      }

      if (
        typeof body.description === "string" &&
        body.description.length > 2000
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La descripción es demasiado larga.",
          },
          { status: 400 },
        );
      }

      updateData.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    /*
     * PRECIO
     */
    if ("price" in body) {
      const price = Number(body.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "El precio debe ser mayor o igual a 0.",
          },
          { status: 400 },
        );
      }

      updateData.price = price;
    }

    /*
     * CATEGORÍA
     */
    if ("categoryId" in body) {
      if (
        body.categoryId !== null &&
        typeof body.categoryId !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La categoría no es válida.",
          },
          { status: 400 },
        );
      }

      updateData.category_id =
        body.categoryId || null;
    }

    /*
     * OCASIÓN
     */
    if ("occasion" in body) {
      if (
        body.occasion !== null &&
        typeof body.occasion !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La ocasión no es válida.",
          },
          { status: 400 },
        );
      }

      if (
        typeof body.occasion === "string" &&
        body.occasion.length > 120
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La ocasión es demasiado larga.",
          },
          { status: 400 },
        );
      }

      updateData.occasion =
        typeof body.occasion === "string"
          ? body.occasion.trim() || null
          : null;
    }

    /*
     * TEMPORADA
     */
    if ("seasonId" in body) {
      if (
        body.seasonId !== null &&
        typeof body.seasonId !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La temporada no es válida.",
          },
          { status: 400 },
        );
      }

      updateData.season_id =
        body.seasonId || null;
    }

    /*
     * DESTACADO
     *
     * Acepta:
     * isFeatured
     * is_featured
     */
    if (
      "isFeatured" in body ||
      "is_featured" in body
    ) {
      const value =
        "isFeatured" in body
          ? body.isFeatured
          : body.is_featured;

      if (typeof value !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: "El valor de destacado no es válido.",
          },
          { status: 400 },
        );
      }

      updateData.is_featured = value;
    }

    /*
     * DISPONIBILIDAD
     *
     * Acepta:
     * isAvailable
     * is_available
     */
    if (
      "isAvailable" in body ||
      "is_available" in body
    ) {
      const value =
        "isAvailable" in body
          ? body.isAvailable
          : body.is_available;

      if (typeof value !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error:
              "El valor de disponibilidad no es válido.",
          },
          { status: 400 },
        );
      }

      updateData.is_available = value;
    }

    /*
     * AGOTADO
     *
     * Acepta:
     * isSoldOut
     * is_sold_out
     */
    if (
      "isSoldOut" in body ||
      "is_sold_out" in body
    ) {
      const value =
        "isSoldOut" in body
          ? body.isSoldOut
          : body.is_sold_out;

      if (typeof value !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error:
              "El valor de agotado no es válido.",
          },
          { status: 400 },
        );
      }

      updateData.is_sold_out = value;
    }

    /*
     * ORDEN DEL CATÁLOGO
     */
    if ("catalogOrder" in body) {
      const catalogOrder = Number(
        body.catalogOrder,
      );

      if (
        !Number.isInteger(catalogOrder) ||
        catalogOrder < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "El orden del catálogo debe ser un entero mayor o igual a 0.",
          },
          { status: 400 },
        );
      }

      updateData.catalog_order = catalogOrder;
    }

    /*
     * ACTIVO
     *
     * Acepta:
     * isActive
     * is_active
     */
    if (
      "isActive" in body ||
      "is_active" in body
    ) {
      const value =
        "isActive" in body
          ? body.isActive
          : body.is_active;

      if (typeof value !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error:
              "El valor de activo no es válido.",
          },
          { status: 400 },
        );
      }

      updateData.is_active = value;
    }

    /*
     * VALIDAR QUE EXISTA ALGO PARA ACTUALIZAR
     */
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay datos para actualizar.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    /*
     * ACTUALIZAR PRODUCTO
     */
    const { data: product, error } =
      await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select(
          "id, name, description, price, category_id, occasion, season_id, is_featured, is_available, is_sold_out, catalog_order, is_active, created_at, updated_at",
        )
        .single();

    if (error) {
      console.error(
        "Error actualizando producto:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Error en PATCH /api/admin/products/[id]:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor.",
      },
      { status: 500 },
    );
  }
}
