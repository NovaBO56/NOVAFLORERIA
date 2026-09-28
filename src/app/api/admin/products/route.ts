import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createProductSchema, listProductsQuerySchema } from "@/validations/products";

const productSelect =
  "id, name, description, price, category_id, occasion, season_id, is_featured, is_available, is_sold_out, catalog_order, is_active, created_at, updated_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = listProductsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Filtros de productos inválidos." },
        { status: 400 },
      );
    }

    const {
      search, category_id, season_id, is_active, is_available, is_sold_out, is_featured,
      min_price, max_price, sort, order, page, limit,
    } = result.data;

    const supabase = await createClient();

    let query = supabase.from("products").select(productSelect, { count: "exact" });

    if (search) query = query.ilike("name", `%${search}%`);
    if (category_id) query = query.eq("category_id", category_id);
    if (season_id) query = query.eq("season_id", season_id);
    if (is_active !== undefined) query = query.eq("is_active", is_active);
    if (is_available !== undefined) query = query.eq("is_available", is_available);
    if (is_sold_out !== undefined) query = query.eq("is_sold_out", is_sold_out);
    if (is_featured !== undefined) query = query.eq("is_featured", is_featured);
    if (min_price !== undefined) query = query.gte("price", min_price);
    if (max_price !== undefined) query = query.lte("price", max_price);

    if (sort) {
      // Con orden explícito se desempata por id para que la paginación sea estable.
      query = query.order(sort, { ascending: order === "asc" }).order("id", { ascending: true });
    } else {
      // Orden por defecto histórico del catálogo (igual que antes de este cambio).
      query = query.order("catalog_order", { ascending: true }).order("name", { ascending: true });
    }

    // Paginación: solo se aplica si mandan "limit" explícitamente. Sin "limit",
    // se devuelve todo lo que matchee (compatibilidad con lo que ya existe).
    if (limit !== undefined) {
      const currentPage = page ?? 1;
      const from = (currentPage - 1) * limit;
      query = query.range(from, from + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error obteniendo productos:", error);
      return NextResponse.json(
        { success: false, message: "No se pudieron obtener los productos." },
        { status: 500 },
      );
    }

    const total = count ?? 0;
    const responseBody: Record<string, unknown> = { success: true, products: data, total };

    if (limit !== undefined) {
      const currentPage = page ?? 1;
      responseBody.pagination = {
        page: currentPage,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de producto inválidos." },
        { status: 400 },
      );
    }

    const {
      name, description, price, category_id, occasion, season_id,
      is_featured, is_available, is_sold_out, catalog_order, is_active,
    } = result.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        price,
        category_id: category_id || null,
        occasion: occasion || null,
        season_id: season_id || null,
        is_featured, is_available, is_sold_out, catalog_order, is_active,
      })
      .select(productSelect)
      .single();

    if (error) {
      console.error("Error creando producto:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo crear el producto." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, product: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el producto.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}