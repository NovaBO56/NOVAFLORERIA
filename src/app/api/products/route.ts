import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPublicProductsQuerySchema } from "@/validations/public-catalog";

// No incluye "description" completa ni campos internos: es el listado
// para tarjetas de catálogo. El detalle completo va en /api/products/[id].
const PUBLIC_PRODUCT_SELECT =
  "id, name, price, category_id, occasion, season_id, is_featured, is_available, is_sold_out, catalog_order, " +
  "images:product_images(id, public_url, alt_text, sort_order)";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = listPublicProductsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Filtros inválidos." },
        { status: 400 },
      );
    }

    const { search, category_id, season_id, occasion, is_featured, min_price, max_price, sort, order, page, limit } =
      result.data;

    const supabase = await createClient();

    // is_active=true siempre: no es un filtro que el visitante controle.
    let query = supabase.from("products").select(PUBLIC_PRODUCT_SELECT, { count: "exact" }).eq("is_active", true);

    if (search) query = query.ilike("name", `%${search}%`);
    if (category_id) query = query.eq("category_id", category_id);
    if (season_id) query = query.eq("season_id", season_id);
    if (occasion) query = query.eq("occasion", occasion);
    if (is_featured !== undefined) query = query.eq("is_featured", is_featured);
    if (min_price !== undefined) query = query.gte("price", min_price);
    if (max_price !== undefined) query = query.lte("price", max_price);

    if (sort) {
      query = query.order(sort, { ascending: order === "asc" }).order("id", { ascending: true });
    } else {
      query = query.order("catalog_order", { ascending: true }).order("name", { ascending: true });
    }

    // Sin esto, las imágenes embebidas vuelven en orden arbitrario y la
    // "imagen principal" (sort_order = 0) no queda necesariamente primera.
    query = query.order("sort_order", { foreignTable: "product_images", ascending: true });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error obteniendo el catálogo:", error);
      return NextResponse.json({ success: false, message: "No se pudo obtener el catálogo." }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json({
      success: true,
      products: data,
      pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("Error inesperado obteniendo el catálogo:", error);
    return NextResponse.json({ success: false, message: "No se pudo obtener el catálogo." }, { status: 500 });
  }
}