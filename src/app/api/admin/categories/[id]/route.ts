import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateCategorySchema } from "@/validations/categories";

const CATEGORY_SELECT = "id, name, description, is_active, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, message: "Categoría no válida." }, { status: 400 });
    }

    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de categoría inválidos." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...result.data };
    if (updates.description !== undefined) {
      updates.description = (updates.description as string | null) || null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select(CATEGORY_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Ya existe una categoría con ese nombre." },
          { status: 409 },
        );
      }
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, message: "La categoría no existe." },
          { status: 404 },
        );
      }
      console.error("Error actualizando categoría:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo actualizar la categoría." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}