import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

const PRODUCT_DETAIL_SELECT = `
  id, name, description, price, category_id, occasion, season_id,
  is_featured, is_available, is_sold_out, catalog_order,
  images:product_images(id, public_url, alt_text, sort_order),
  components:product_components(
    id, quantity,
    component_product:products!product_components_component_product_id_fkey(
      id, name, price, is_available, is_sold_out
    )
  ),
  customization_options(id, option_type, name, value, extra_price)
`;

// Público: solo devuelve el producto si is_active=true (RLS ya lo filtra,
// pero igual se valida acá para dar un 404 claro en vez de un 200 vacío).
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_DETAIL_SELECT)
      .eq("id", id)
      .eq("is_active", true)
      // Sin esto, product_images vuelve en orden arbitrario y la "imagen
      // principal" (sort_order = 0) no queda necesariamente primera.
      .order("sort_order", { foreignTable: "product_images", ascending: true })
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo el producto:", error);
      return NextResponse.json({ success: false, message: "No se pudo obtener el producto." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "El producto no existe." }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    console.error("Error inesperado obteniendo el producto:", error);
    return NextResponse.json({ success: false, message: "No se pudo obtener el producto." }, { status: 500 });
  }
}