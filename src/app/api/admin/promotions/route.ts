import { NextResponse } from "next/server";
import {
  requireEmployeeOrAdmin,
  requireAdmin,
} from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createPromotionSchema } from "@/validations/promotions";

const PROMOTION_SELECT =
  "id, name, description, promotion_type, discount_type, discount_value, combo_price, starts_at, ends_at, minimum_purchase, is_active, created_at, updated_at";

// El listado incluye los productos de cada promoción (con su cantidad)
// para mostrarlos en la pantalla sin pedir cada promoción por separado.
const PROMOTION_LIST_SELECT = `${PROMOTION_SELECT}, items:promotion_products(product_id, quantity, product:products(id, name, price))`;

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET() {
  try {
    // Cualquier miembro del personal puede VER las promociones (para aplicarlas).
    await requireEmployeeOrAdmin();
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Acceso no autorizado.",
      403,
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotions")
      .select(PROMOTION_LIST_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo promociones:", error);

      return fail("No se pudieron obtener las promociones.", 500);
    }

    return NextResponse.json({ success: true, promotions: data });
  } catch (error) {
    console.error("Error inesperado obteniendo promociones:", error);

    return fail("No se pudieron obtener las promociones.", 500);
  }
}

export async function POST(request: Request) {
  // Solo el ADMINISTRADOR crea/configura promociones.
  try {
    await requireAdmin();
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Acceso no autorizado.",
      403,
    );
  }

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("El cuerpo de la solicitud no es JSON válido.", 400);
    }

    const result = createPromotionSchema.safeParse(body);

    if (!result.success) {
      return fail(
        result.error.issues[0]?.message ?? "Datos de promoción inválidos.",
        400,
      );
    }

    const data = result.data;
    const supabase = await createClient();

    const insertPayload: {
      name: string;
      description: string | null;
      promotion_type: "producto" | "combo";
      discount_type: "porcentaje" | "monto_fijo" | null;
      discount_value: number | null;
      combo_price: number | null;
      starts_at: string | null;
      ends_at: string | null;
      minimum_purchase: number | null;
    } =
      data.promotion_type === "producto"
        ? {
            name: data.name,
            description: data.description || null,
            promotion_type: "producto",
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            combo_price: null,
            starts_at: data.starts_at ?? null,
            ends_at: data.ends_at ?? null,
            minimum_purchase: data.minimum_purchase ?? null,
          }
        : {
            name: data.name,
            description: data.description || null,
            promotion_type: "combo",
            discount_type: null,
            discount_value: null,
            combo_price: data.combo_price,
            starts_at: data.starts_at ?? null,
            ends_at: data.ends_at ?? null,
            minimum_purchase: data.minimum_purchase ?? null,
          };

    const { data: promotion, error } = await supabase
      .from("promotions")
      .insert(insertPayload)
      .select(PROMOTION_SELECT)
      .single();

    if (error) {
      console.error("Error creando promoción:", error);

      if (error.code === "23514") {
        return fail("Los datos no cumplen las reglas de la promoción.", 400);
      }

      return fail("No se pudo crear la promoción.", 500);
    }

    return NextResponse.json({ success: true, promotion }, { status: 201 });
  } catch (error) {
    console.error("Error inesperado creando promoción:", error);

    return fail("No se pudo crear la promoción.", 500);
  }
}