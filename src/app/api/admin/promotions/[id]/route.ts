import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updatePromotionSchema } from "@/validations/promotions";

const PROMOTION_SELECT =
  "id, name, description, promotion_type, discount_type, discount_value, combo_price, starts_at, ends_at, minimum_purchase, is_active, created_at, updated_at";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();

    const result = updatePromotionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ??
            "Datos inválidos.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // --------------------------------------------------------
    // Obtener la promoción existente para conocer su tipo.
    // promotion_type no se puede cambiar mediante PATCH.
    // --------------------------------------------------------

    const {
      data: existingPromotion,
      error: existingError,
    } = await supabase
      .from("promotions")
      .select("id, promotion_type")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Error obteniendo la promoción:",
        existingError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo verificar la promoción.",
        },
        { status: 500 },
      );
    }

    if (!existingPromotion) {
      return NextResponse.json(
        {
          success: false,
          message: "La promoción no existe.",
        },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = {
      ...result.data,
    };

    // --------------------------------------------------------
    // Normalizar descripción.
    // --------------------------------------------------------

    if (updates.description !== undefined) {
      updates.description =
        (updates.description as string | null) || null;
    }

    // --------------------------------------------------------
    // Promoción por PRODUCTO
    //
    // Puede utilizar:
    //   discount_type
    //   discount_value
    //
    // No puede utilizar:
    //   combo_price
    // --------------------------------------------------------

    if (
      existingPromotion.promotion_type ===
      "producto"
    ) {
      if (
        updates.combo_price !== undefined &&
        updates.combo_price !== null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Una promoción de producto no puede utilizar combo_price.",
          },
          { status: 400 },
        );
      }

      const hasDiscountType =
        updates.discount_type !== undefined;

      const hasDiscountValue =
        updates.discount_value !== undefined;

      if (hasDiscountType !== hasDiscountValue) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Para modificar el descuento debes enviar discount_type y discount_value.",
          },
          { status: 400 },
        );
      }

      if (
        updates.discount_type === null ||
        updates.discount_value === null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Una promoción de producto debe tener discount_type y discount_value.",
          },
          { status: 400 },
        );
      }

      // El frontend puede enviar combo_price: null.
      // Para una promoción de producto simplemente no se guarda.
      delete updates.combo_price;
    }

    // --------------------------------------------------------
    // Promoción COMBO
    //
    // Puede utilizar:
    //   combo_price
    //
    // No puede utilizar:
    //   discount_type
    //   discount_value
    // --------------------------------------------------------

    if (
      existingPromotion.promotion_type ===
      "combo"
    ) {
      if (
        (updates.discount_type !== undefined &&
          updates.discount_type !== null) ||
        (updates.discount_value !== undefined &&
          updates.discount_value !== null)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Una promoción combo no puede utilizar discount_type ni discount_value. Debe utilizar combo_price.",
          },
          { status: 400 },
        );
      }

      // El frontend puede enviar ambos campos como null.
      // Para un combo simplemente no se guardan.
      delete updates.discount_type;
      delete updates.discount_value;
    }

    // --------------------------------------------------------
    // Ejecutar actualización.
    // --------------------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", id)
      .select(PROMOTION_SELECT)
      .maybeSingle();

    if (error) {
      console.error(
        "Error actualizando promoción:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo actualizar la promoción.",
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "La promoción no existe.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      promotion: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Acceso no autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}