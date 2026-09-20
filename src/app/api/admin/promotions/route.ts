import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin, requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createPromotionSchema } from "@/validations/promotions";

const PROMOTION_SELECT =
  "id, name, description, promotion_type, discount_type, discount_value, starts_at, ends_at, minimum_purchase, is_active, created_at, updated_at";

export async function GET() {
  try {
    // Cualquier miembro del personal puede VER las promociones (para aplicarlas).
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotions")
      .select(PROMOTION_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo promociones:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las promociones." }, { status: 500 });
    }

    return NextResponse.json({ success: true, promotions: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    // Solo el ADMINISTRADOR crea/configura promociones.
    await requireAdmin();

    const body = await request.json();
    const result = createPromotionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de promoción inválidos." },
        { status: 400 },
      );
    }

    const { name, description, promotion_type, discount_type, discount_value, starts_at, ends_at, minimum_purchase } =
      result.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .insert({
        name,
        description: description || null,
        promotion_type,
        discount_type,
        discount_value,
        starts_at: starts_at || null,
        ends_at: ends_at || null,
        minimum_purchase: minimum_purchase ?? null,
      })
      .select(PROMOTION_SELECT)
      .single();

    if (error) {
      console.error("Error creando promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo crear la promoción." }, { status: 500 });
    }

    return NextResponse.json({ success: true, promotion: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}