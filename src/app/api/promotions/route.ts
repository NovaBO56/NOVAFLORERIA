import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Solo lo que el visitante necesita ver. La configuración interna
// (quién la creó, fechas de edición, etc.) no sale de aquí.
const PUBLIC_PROMOTION_SELECT =
  "id, name, description, promotion_type, discount_type, discount_value, combo_price, starts_at, ends_at, minimum_purchase";

/**
 * GET /api/promotions — promociones vigentes para la página principal.
 *
 * Público. RLS ya limita a promociones activas para un visitante sin
 * sesión (promotions_public_select_active); aquí además se filtra por
 * fechas, porque una promoción puede estar "activa" pero vencida o
 * programada.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotions")
      .select(PUBLIC_PROMOTION_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo promociones públicas:", error);

      return NextResponse.json(
        { success: false, message: "No se pudieron obtener las promociones." },
        { status: 500 },
      );
    }

    const now = Date.now();

    const promotions = (data ?? []).filter(
      (promotion) =>
        (!promotion.starts_at || Date.parse(promotion.starts_at) <= now) &&
        (!promotion.ends_at || Date.parse(promotion.ends_at) >= now),
    );

    // Association RLS is staff-only. Read only the already-public promotion IDs
    // on the server; never expose staff fields or broaden table/RPC permissions.
    if (!promotions.length) return NextResponse.json({ success: true, promotions: [] });
    const { data: components, error: componentError } = await createAdminClient()
      .from("promotion_products")
      .select("promotion_id, product_id, quantity, product:products(price)")
      .in("promotion_id", promotions.map(promotion => promotion.id));
    if (componentError) return NextResponse.json({ success: false, message: "No se pudieron consultar las condiciones de las promociones." }, { status: 503 });
    return NextResponse.json({ success: true, promotions: promotions.map(promotion => ({
      ...promotion,
      products: (components ?? []).filter(component => component.promotion_id === promotion.id).flatMap(component => {
        const product = Array.isArray(component.product) ? component.product[0] : component.product;
        return product && Number.isFinite(Number(product.price)) ? [{ product_id: component.product_id, quantity: Number(component.quantity), unit_price: Number(product.price) }] : [];
      }),
    })) });
  } catch (error) {
    console.error("Error inesperado obteniendo promociones públicas:", error);

    return NextResponse.json(
      { success: false, message: "No se pudieron obtener las promociones." },
      { status: 500 },
    );
  }
}
