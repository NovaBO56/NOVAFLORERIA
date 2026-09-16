import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateRequirementSchema } from "@/validations/product-recipe";

type RouteContext = { params: Promise<{ id: string; requirementId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id, requirementId } = await context.params;

    const body = await request.json();
    const result = updateRequirementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Cantidad inválida." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_inventory_requirements")
      .update({ quantity: result.data.quantity })
      .eq("id", requirementId)
      .eq("product_id", id)
      .select("id, product_id, inventory_item_id, quantity")
      .maybeSingle();

    if (error) {
      console.error("Error actualizando ingrediente de la receta:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar el ingrediente." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "El ingrediente no existe para este producto." }, { status: 404 });
    }

    return NextResponse.json({ success: true, requirement: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id, requirementId } = await context.params;

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("product_inventory_requirements")
      .delete({ count: "exact" })
      .eq("id", requirementId)
      .eq("product_id", id);

    if (error) {
      console.error("Error eliminando ingrediente de la receta:", error);
      return NextResponse.json({ success: false, message: "No se pudo eliminar el ingrediente." }, { status: 500 });
    }
    if (!count) {
      return NextResponse.json({ success: false, message: "El ingrediente no existe para este producto." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Ingrediente eliminado de la receta." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}