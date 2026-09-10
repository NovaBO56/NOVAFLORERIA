import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
    componentId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

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