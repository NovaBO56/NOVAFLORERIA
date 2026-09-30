import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateOptionRequirementSchema } from "@/validations/product-recipe";

type RouteContext = {
  params: Promise<{
    id: string;
    optionId: string;
    requirementId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const {
      id,
      optionId,
      requirementId,
    } = await context.params;

    const body = await request.json();

    const result =
      updateOptionRequirementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ??
            "Cantidad inválida.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verificar que la opción pertenece al producto.
    const { data: option, error: optionError } =
      await supabase
        .from("customization_options")
        .select("id")
        .eq("id", optionId)
        .eq("product_id", id)
        .maybeSingle();

    if (optionError) {
      console.error(
        "Error verificando opción de personalización:",
        optionError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo verificar la opción.",
        },
        { status: 500 },
      );
    }

    if (!option) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La opción de personalización no existe para este producto.",
        },
        { status: 404 },
      );
    }

    // Actualizar únicamente el requisito que pertenece
    // a esta opción.
    const { data, error } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .update({
        quantity: result.data.quantity,
      })
      .eq("id", requirementId)
      .eq("customization_option_id", optionId)
      .select(
        "id, customization_option_id, inventory_item_id, quantity",
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Error actualizando inventario de la opción:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo actualizar el ítem.",
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El ítem no existe para esta opción.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      requirement: data,
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

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const {
      id,
      optionId,
      requirementId,
    } = await context.params;

    const supabase = await createClient();

    // Verificar que la opción pertenece al producto.
    const { data: option, error: optionError } =
      await supabase
        .from("customization_options")
        .select("id")
        .eq("id", optionId)
        .eq("product_id", id)
        .maybeSingle();

    if (optionError) {
      console.error(
        "Error verificando opción de personalización:",
        optionError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo verificar la opción.",
        },
        { status: 500 },
      );
    }

    if (!option) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La opción de personalización no existe para este producto.",
        },
        { status: 404 },
      );
    }

    const {
      error,
      count,
    } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .delete({ count: "exact" })
      .eq("id", requirementId)
      .eq("customization_option_id", optionId);

    if (error) {
      console.error(
        "Error eliminando inventario de la opción:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo eliminar el ítem.",
        },
        { status: 500 },
      );
    }

    if (!count) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El ítem no existe para esta opción.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Ítem eliminado de la opción.",
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