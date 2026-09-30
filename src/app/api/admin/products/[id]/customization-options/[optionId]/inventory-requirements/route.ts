import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  addOptionRequirementSchema,
  updateOptionRequirementSchema,
} from "@/validations/product-recipe";

type RouteContext = {
  params: Promise<{
    id: string;
    optionId: string;
  }>;
};

const REQUIREMENT_SELECT = `
  id,
  customization_option_id,
  inventory_item_id,
  quantity,
  created_at,
  inventory_item:inventory_items (
    id,
    name,
    unit,
    current_stock,
    item_type
  )
`;

async function verifyOptionBelongsToProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  optionId: string,
) {
  const { data, error } = await supabase
    .from("customization_options")
    .select("id")
    .eq("id", optionId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error(
      "Error verificando opción de personalización:",
      error,
    );

    return {
      option: null,
      error: "No se pudo verificar la opción de personalización.",
      status: 500,
    };
  }

  if (!data) {
    return {
      option: null,
      error:
        "La opción de personalización no existe para este producto.",
      status: 404,
    };
  }

  return {
    option: data,
    error: null,
    status: 200,
  };
}

/**
 * GET
 * Obtiene los inventarios que consume una opción.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const { id, optionId } = await context.params;
    const supabase = await createClient();

    const verification = await verifyOptionBelongsToProduct(
      supabase,
      id,
      optionId,
    );

    if (!verification.option) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
        },
        { status: verification.status },
      );
    }

    const { data, error } = await supabase
      .from("customization_option_inventory_requirements")
      .select(REQUIREMENT_SELECT)
      .eq("customization_option_id", optionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "Error obteniendo el inventario de la opción:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo obtener el inventario de la opción.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      requirements: data,
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


/**
 * POST
 * Agrega un ítem de inventario que consume la opción.
 */
export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const { id, optionId } = await context.params;

    const body = await request.json();

    const result = addOptionRequirementSchema.safeParse(body);

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

    const {
      inventory_item_id,
      quantity,
    } = result.data;

    const supabase = await createClient();

    // Verificar que la opción pertenece al producto.
    const verification = await verifyOptionBelongsToProduct(
      supabase,
      id,
      optionId,
    );

    if (!verification.option) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
        },
        { status: verification.status },
      );
    }

    // Verificar que el ítem de inventario existe.
    const {
      data: inventoryItem,
      error: inventoryItemError,
    } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("id", inventory_item_id)
      .maybeSingle();

    if (inventoryItemError) {
      console.error(
        "Error verificando ítem de inventario:",
        inventoryItemError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo verificar el ítem de inventario.",
        },
        { status: 500 },
      );
    }

    if (!inventoryItem) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El ítem de inventario no existe.",
        },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .insert({
        customization_option_id: optionId,
        inventory_item_id,
        quantity,
      })
      .select(REQUIREMENT_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Esta opción ya tiene ese ítem asignado. Edítalo en vez de duplicarlo.",
          },
          { status: 409 },
        );
      }

      console.error(
        "Error agregando inventario a la opción:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo agregar el ítem.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        requirement: data,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo agregar el ítem.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}


/**
 * PATCH
 * Modifica la cantidad de inventario que consume una opción.
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const { id, optionId } = await context.params;

    const body = await request.json();

    const result = updateOptionRequirementSchema.safeParse(body);

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

    const { quantity } = result.data;

    const supabase = await createClient();

    // Verificar que la opción pertenece al producto.
    const verification = await verifyOptionBelongsToProduct(
      supabase,
      id,
      optionId,
    );

    if (!verification.option) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
        },
        { status: verification.status },
      );
    }

    // El ID del requirement se recibe por query string:
    // ?requirementId=...
    const { searchParams } = new URL(request.url);
    const requirementId =
      searchParams.get("requirementId");

    if (!requirementId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El requirementId es obligatorio.",
        },
        { status: 400 },
      );
    }

    // Verificar que el requirement pertenece realmente
    // a esta opción.
    const {
      data: requirement,
      error: requirementError,
    } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .select("id")
      .eq("id", requirementId)
      .eq("customization_option_id", optionId)
      .maybeSingle();

    if (requirementError) {
      console.error(
        "Error verificando requisito de inventario:",
        requirementError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo verificar el requisito.",
        },
        { status: 500 },
      );
    }

    if (!requirement) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El requisito de inventario no existe para esta opción.",
        },
        { status: 404 },
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .update({
        quantity,
      })
      .eq("id", requirementId)
      .eq("customization_option_id", optionId)
      .select(REQUIREMENT_SELECT)
      .single();

    if (error) {
      console.error(
        "Error actualizando requisito de inventario:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo actualizar el requisito.",
        },
        { status: 500 },
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
        : "No se pudo actualizar el requisito.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}


/**
 * DELETE
 * Elimina un ítem de inventario asignado a una opción.
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const { id, optionId } = await context.params;

    const supabase = await createClient();

    // Verificar que la opción pertenece al producto.
    const verification = await verifyOptionBelongsToProduct(
      supabase,
      id,
      optionId,
    );

    if (!verification.option) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
        },
        { status: verification.status },
      );
    }

    // El ID del requirement se recibe por query string:
    // ?requirementId=...
    const { searchParams } = new URL(request.url);
    const requirementId =
      searchParams.get("requirementId");

    if (!requirementId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El requirementId es obligatorio.",
        },
        { status: 400 },
      );
    }

    const {
      data: requirement,
      error: requirementError,
    } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .select("id")
      .eq("id", requirementId)
      .eq("customization_option_id", optionId)
      .maybeSingle();

    if (requirementError) {
      console.error(
        "Error verificando requisito de inventario:",
        requirementError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo verificar el requisito.",
        },
        { status: 500 },
      );
    }

    if (!requirement) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El requisito de inventario no existe para esta opción.",
        },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from(
        "customization_option_inventory_requirements",
      )
      .delete()
      .eq("id", requirementId)
      .eq("customization_option_id", optionId);

    if (error) {
      console.error(
        "Error eliminando requisito de inventario:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No se pudo eliminar el requisito.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Requisito de inventario eliminado correctamente.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo eliminar el requisito.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}