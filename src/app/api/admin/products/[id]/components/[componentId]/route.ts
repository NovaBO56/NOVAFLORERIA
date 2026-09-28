import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateComponentSchema } from "@/validations/product-components";

type RouteContext = {
  params: Promise<{
    id: string;
    componentId: string;
  }>;
};

const componentSelect = `
  id,
  parent_product_id,
  component_product_id,
  quantity,
  created_at,
  component_product:products!product_components_component_product_id_fkey (
    id, name, price, is_active, is_available, is_sold_out
  )
`;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id, componentId } = await context.params;

    const body = await request.json();
    const result = updateComponentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Cantidad inválida." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_components")
      .update({ quantity: result.data.quantity })
      .eq("id", componentId)
      .eq("parent_product_id", id)
      .select(componentSelect)
      .maybeSingle();

    if (error) {
      console.error("Error actualizando componente:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar el componente." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { success: false, message: "El componente no existe en este producto." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, component: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireEmployeeOrAdmin();

    const { id, componentId } = await context.params;
    const supabase = await createClient();

    const { data: component, error: findError } = await supabase
      .from("product_components")
      .select("id")
      .eq("id", componentId)
      .eq("parent_product_id", id)
      .maybeSingle();

    if (findError) {
      console.error(
        "Error buscando componente:",
        findError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo verificar el componente.",
        },
        { status: 500 },
      );
    }

    if (!component) {
      return NextResponse.json(
        {
          success: false,
          message: "El componente no existe en este producto.",
        },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase
      .from("product_components")
      .delete()
      .eq("id", componentId)
      .eq("parent_product_id", id);

    if (deleteError) {
      console.error(
        "Error eliminando componente:",
        deleteError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo eliminar el componente.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Componente eliminado correctamente.",
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