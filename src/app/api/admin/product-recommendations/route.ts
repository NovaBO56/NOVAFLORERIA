import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { globalRecommendationsSchema } from "@/validations/product-recommendations";
import { recommendationProducts } from "@/lib/product-recommendations.server";

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ success: false, message: "Acceso exclusivo para administradores." }, { status: 403 }); }
  try {
    const { data, error } = await createAdminClient().from("product_recommendation_settings").select("enabled,scope,product_ids,category_ids,excluded_category_ids,excluded_product_ids,revision").eq("key", "global").single();
    if (error || !data) return NextResponse.json({ success: false, message: "La configuración global no está disponible. Revisa la migración de complementos." }, { status: 503 });
    const products = await recommendationProducts([...new Set([...data.product_ids, ...data.excluded_product_ids])] as string[], true);
    return NextResponse.json({ success: true, config: data, products });
  } catch { return NextResponse.json({ success: false, message: "No se pudo consultar la configuración." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  let actor;
  try { actor = await requireAdmin(); } catch { return NextResponse.json({ success: false }, { status: 403 }); }
  const parsed = globalRecommendationsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Revisa la configuración." }, { status: 400 });
  const value = parsed.data;
  const { data, error } = await createAdminClient().rpc("save_global_product_recommendations", { p_enabled: value.enabled, p_scope: value.scope, p_products: value.product_ids, p_categories: value.category_ids, p_excluded_categories: value.excluded_category_ids, p_excluded_products: value.excluded_product_ids, p_revision: value.revision, p_actor: actor.id });
  if (error) return NextResponse.json({ success: false, message: error.code === "40001" ? "La configuración cambió en otra sesión. Recarga antes de guardar." : "No se pudo guardar. Revisa las referencias y los productos seleccionados." }, { status: error.code === "40001" ? 409 : 400 });
  return NextResponse.json({ success: true, revision: data });
}
