
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const productSelect =
  "id, name, description, price, category_id, occasion, season_id, is_featured, is_available, is_sold_out, catalog_order, is_active, created_at, updated_at";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(productSelect)
      .order("catalog_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo productos:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron obtener los productos.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      products: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Acceso no autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const occasion =
      typeof body.occasion === "string"
        ? body.occasion.trim()
        : "";

    const price =
      typeof body.price === "number"
        ? body.price
        : Number(body.price);

    const catalogOrder =
      typeof body.catalog_order === "number"
        ? body.catalog_order
        : Number(body.catalog_order ?? 0);

    const categoryId =
      typeof body.category_id === "string" &&
      body.category_id
        ? body.category_id
        : null;

    const seasonId =
      typeof body.season_id === "string" &&
      body.season_id
        ? body.season_id
        : null;

    const isFeatured =
      typeof body.is_featured === "boolean"
        ? body.is_featured
        : false;

    const isAvailable =
      typeof body.is_available === "boolean"
        ? body.is_available
        : true;

    const isSoldOut =
      typeof body.is_sold_out === "boolean"
        ? body.is_sold_out
        : false;

    const isActive =
      typeof body.is_active === "boolean"
        ? body.is_active
        : true;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre del producto es obligatorio.",
        },
        { status: 400 },
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre del producto es demasiado largo.",
        },
        { status: 400 },
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "La descripción es demasiado larga.",
        },
        { status: 400 },
      );
    }

    if (occasion.length > 120) {
      return NextResponse.json(
        {
          success: false,
          message: "La ocasión es demasiado larga.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El precio debe ser un número mayor o igual a cero.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(catalogOrder) ||
      catalogOrder < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El orden del catálogo debe ser un número entero mayor o igual a cero.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        price,
        category_id: categoryId,
        occasion: occasion || null,
        season_id: seasonId,
        is_featured: isFeatured,
        is_available: isAvailable,
        is_sold_out: isSoldOut,
        catalog_order: catalogOrder,
        is_active: isActive,
      })
      .select(productSelect)
      .single();

    if (error) {
      console.error("Error creando producto:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear el producto.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: data,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear el producto.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}
