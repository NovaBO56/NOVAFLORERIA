import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    console.error("Error inesperado obteniendo promociones públicas:", error);

    return NextResponse.json(
      { success: false, message: "No se pudieron obtener las promociones." },
      { status: 500 },
    );
  }
}