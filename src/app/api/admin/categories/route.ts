import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createCategorySchema } from "@/validations/categories";

const CATEGORY_SELECT = "id, name, description, is_active, created_at, updated_at";

export async function GET() {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select(CATEGORY_SELECT)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo categorías:", error);
      return NextResponse.json(
        { success: false, message: "No se pudieron obtener las categorías." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, categories: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de categoría inválidos." },
        { status: 400 },
      );
    }

    const { name, description } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, description: description || null })
      .select(CATEGORY_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Ya existe una categoría con ese nombre." },
          { status: 409 },
        );
      }
      console.error("Error creando categoría:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo crear la categoría." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}