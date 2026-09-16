import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateCustomizationOptionSchema } from "@/validations/product-recipe";

type RouteContext = { params: Promise<{ id: string; optionId: string }> };

const OPTION_SELECT = "id, product_id, option_type, name, value, extra_price, is_active, created_at";

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id, optionId } = await context.params;

    const body = await request.json();
    const result = updateCustomizationOptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...result.data };
    if (updates.value !== undefined) {
      updates.value = (updates.value as string | null) || null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customization_options")
      .update(updates)
      .eq("id", optionId)
      .eq("product_id", id)
      .select(OPTION_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Error actualizando opción de personalización:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar la opción." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "La opción no existe para este producto." }, { status: 404 });
    }

    return NextResponse.json({ success: true, option: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id, optionId } = await context.params;

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("customization_options")
      .delete({ count: "exact" })
      .eq("id", optionId)
      .eq("product_id", id);

    if (error) {
      console.error("Error eliminando opción de personalización:", error);
      return NextResponse.json({ success: false, message: "No se pudo eliminar la opción." }, { status: 500 });
    }
    if (!count) {
      return NextResponse.json({ success: false, message: "La opción no existe para este producto." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Opción de personalización eliminada." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}