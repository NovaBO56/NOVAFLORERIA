import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createProductSchema } from "@/validations/products";

const productSelect =
  "id, name, description, price, category_id, occasion, season_id, is_featured, is_available, is_sold_out, catalog_order, is_active, created_at, updated_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = supabase
      .from("products")
      .select(productSelect)
      .order("catalog_order", { ascending: true })
      .order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo productos:", error);
      return NextResponse.json(
        { success: false, message: "No se pudieron obtener los productos." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, products: data });
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