import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updatePromotionSchema } from "@/validations/promotions";

const PROMOTION_SELECT =
  "id, name, description, promotion_type, discount_type, discount_value, starts_at, ends_at, minimum_purchase, is_active, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = updatePromotionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...result.data };
    if (updates.description !== undefined) {
      updates.description = (updates.description as string | null) || null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select(PROMOTION_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Error actualizando promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar la promoción." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "La promoción no existe." }, { status: 404 });
    }

    return NextResponse.json({ success: true, promotion: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}