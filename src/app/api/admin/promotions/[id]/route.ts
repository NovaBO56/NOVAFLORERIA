import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  findFixedDiscountViolation,
  fixedDiscountMessage,
} from "@/lib/promotions/fixed-discount";
import { updatePromotionSchema } from "@/validations/promotions";

const PROMOTION_SELECT =
  "id, name, description, promotion_type, discount_type, discount_value, combo_price, starts_at, ends_at, minimum_purchase, is_active, created_at, updated_at";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function PATCH(request: Request, context: RouteContext) {
  // Solo el ADMINISTRADOR modifica promociones.
  try {
    await requireAdmin();
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Acceso no autorizado.",
      403,
    );
  }

  try {
    const { id } = await context.params;

    if (!z.string().uuid().safeParse(id).success) {
      return fail("El identificador de la promoción no es válido.", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("El cuerpo de la solicitud no es JSON válido.", 400);
    }

    const result = updatePromotionSchema.safeParse(body);

    if (!result.success) {
      return fail(result.error.issues[0]?.message ?? "Datos inválidos.", 400);
    }

    const supabase = await createClient();

    // --------------------------------------------------------
    // Promoción existente: se necesita su tipo (no cambia nunca)
    // y sus fechas actuales para validar el orden cuando el PATCH
    // solo trae una de las dos.
    // --------------------------------------------------------

    const { data: existing, error: existingError } = await supabase
      .from("promotions")
      .select("id, promotion_type, starts_at, ends_at")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("Error obteniendo la promoción:", existingError);

      return fail("No se pudo verificar la promoción.", 500);
    }

    if (!existing) {
      return fail("La promoción no existe.", 404);
    }

    const updates: Record<string, unknown> = { ...result.data };

    if (updates.description !== undefined) {
      updates.description = (updates.description as string | null) || null;
    }

    // --------------------------------------------------------
    // Promoción por PRODUCTO: discount_type + discount_value.
    // No admite combo_price.
    // --------------------------------------------------------

    if (existing.promotion_type === "producto") {
      if (updates.combo_price !== undefined && updates.combo_price !== null) {
        return fail(
          "Una promoción de producto no puede tener precio de combo.",
          400,
        );
      }

      if ((updates.discount_type !== undefined) !== (updates.discount_value !== undefined)) {
        return fail(
          "Para modificar el descuento debes enviar el tipo y el valor juntos.",
          400,
        );
      }

      if (updates.discount_type === null || updates.discount_value === null) {
        return fail(
          "Una promoción de producto debe tener tipo y valor de descuento.",
          400,
        );
      }

      delete updates.combo_price;

      // ------------------------------------------------------
      // Regla: con MONTO FIJO, el descuento no puede superar el
      // precio del producto más barato de la promoción.
      // ------------------------------------------------------

      if (
        updates.discount_type === "monto_fijo" &&
        typeof updates.discount_value === "number"
      ) {
        const { data: attached, error: attachedError } = await supabase
          .from("promotion_products")
          .select("product:products(name, price)")
          .eq("promotion_id", id);

        if (attachedError) {
          console.error("Error obteniendo productos de la promoción:", attachedError);

          return fail("No se pudieron verificar los productos de la promoción.", 500);
        }

        type RawProduct = { name: string; price: number | string };

        const products = ((attached ?? []) as unknown as {
          product: RawProduct | RawProduct[] | null;
        }[])
          .map((row) => (Array.isArray(row.product) ? row.product[0] : row.product))
          .filter((product): product is RawProduct => Boolean(product))
          .map((product) => ({
            name: product.name,
            price: Number(product.price),
          }));

        const violation = findFixedDiscountViolation(
          updates.discount_value,
          products,
        );

        if (violation) {
          return fail(
            fixedDiscountMessage(updates.discount_value, violation),
            400,
          );
        }
      }
    }

    // --------------------------------------------------------
    // Promoción COMBO: combo_price.
    // No admite discount_type ni discount_value.
    // --------------------------------------------------------

    if (existing.promotion_type === "combo") {
      if (
        (updates.discount_type !== undefined && updates.discount_type !== null) ||
        (updates.discount_value !== undefined && updates.discount_value !== null)
      ) {
        return fail(
          "Un combo no usa descuento: define su precio final.",
          400,
        );
      }

      if (updates.combo_price === null) {
        return fail("Un combo debe tener precio final.", 400);
      }

      delete updates.discount_type;
      delete updates.discount_value;
    }

    // --------------------------------------------------------
    // Fechas: se comparan contra las ya guardadas.
    // --------------------------------------------------------

    const nextStartsAt =
      updates.starts_at !== undefined
        ? (updates.starts_at as string | null)
        : (existing.starts_at as string | null);

    const nextEndsAt =
      updates.ends_at !== undefined
        ? (updates.ends_at as string | null)
        : (existing.ends_at as string | null);

    if (
      nextStartsAt &&
      nextEndsAt &&
      Date.parse(nextEndsAt) <= Date.parse(nextStartsAt)
    ) {
      return fail(
        "La fecha de finalización debe ser posterior a la de inicio.",
        400,
      );
    }

    // promotions no tiene trigger de updated_at.
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select(PROMOTION_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Error actualizando promoción:", error);

      // 23514 = check_violation (reglas de la tabla promotions)
      if (error.code === "23514") {
        return fail("Los datos no cumplen las reglas de la promoción.", 400);
      }

      return fail("No se pudo actualizar la promoción.", 500);
    }

    if (!data) {
      return fail("La promoción no existe.", 404);
    }

    return NextResponse.json({ success: true, promotion: data });
  } catch (error) {
    console.error("Error inesperado actualizando promoción:", error);

    return fail("No se pudo actualizar la promoción.", 500);
  }
}