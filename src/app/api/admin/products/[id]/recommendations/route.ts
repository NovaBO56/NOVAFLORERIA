import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recommendationProducts } from "@/lib/product-recommendations.server";
import { customRecommendationsSchema, recommendationModeSchema } from "@/validations/product-recommendations";
type Context = { params: Promise<{ id: string }> };
async function preference(id: string) {
  const { data, error } = await createAdminClient().from("product_recommendation_preferences").select("mode,revision").eq("product_id", id).maybeSingle();
  if (error) throw new Error("Preferences unavailable");
  return data;
}
export async function GET(_request: Request, context: Context) {
  try { await requireAdmin(); } catch { return NextResponse.json({ success: false, message: "Acceso exclusivo para administradores." }, { status: 403 }); }
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false }, { status: 400 });
    const { data, error } = await createAdminClient().from("product_recommendations").select("recommended_product_id,sort_order").eq("product_id", id).order("sort_order");
    if (error) throw new Error();
    const ids = (data ?? []).map(row => row.recommended_product_id);
    const saved = await preference(id);
    return NextResponse.json({ success: true, product_ids: ids, products: await recommendationProducts(ids, true), mode: saved?.mode ?? (ids.length ? "custom" : "global"), revision: saved?.revision ?? 0 });
  } catch { return NextResponse.json({ success: false, message: "No se pudieron cargar los complementos." }, { status: 503 }); }
}
async function update(request: Request, context: Context, modeOnly: boolean) {
  let actor;
  try { actor = await requireAdmin(); } catch { return NextResponse.json({ success: false }, { status: 403 }); }
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = modeOnly ? recommendationModeSchema.safeParse(body) : customRecommendationsSchema.safeParse(body);
  if (!z.string().uuid().safeParse(id).success || !parsed.success || parsed.data.product_ids?.includes(id)) return NextResponse.json({ success: false, message: "Elige hasta cuatro productos distintos del principal." }, { status: 400 });
  try {
    const revision = parsed.data.revision ?? (await preference(id))?.revision ?? 0;
    const mode = "mode" in parsed.data ? parsed.data.mode : "custom";
    const { data, error } = await createAdminClient().rpc("save_product_recommendation_preferences", { p_product: id, p_mode: mode, p_recommendations: mode === "custom" ? parsed.data.product_ids : null, p_revision: revision, p_actor: actor.id });
    if (error) return NextResponse.json({ success: false, message: error.code === "40001" ? "La configuración cambió. Cierra y vuelve a abrir antes de guardar." : "No se pudo guardar. Revisa que los productos sigan activos y que no formen un ciclo de recomendaciones." }, { status: error.code === "40001" ? 409 : 400 });
    return NextResponse.json({ success: true, revision: data });
  } catch { return NextResponse.json({ success: false, message: "No se pudo guardar la configuración." }, { status: 503 }); }
}
export const PUT = (request: Request, context: Context) => update(request, context, false);
export const PATCH = (request: Request, context: Context) => update(request, context, true);
