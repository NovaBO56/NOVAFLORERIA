import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateSeasonSchema } from "@/validations/seasons";

const SEASON_SELECT = "id, name, description, starts_at, ends_at, is_active, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "El identificador de la temporada es obligatorio." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = updateSeasonSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de temporada inválidos." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...result.data };
    if (updates.description !== undefined) {
      updates.description = (updates.description as string | null) || null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seasons")
      .update(updates)
      .eq("id", id)
      .select(SEASON_SELECT)
      .single();

    if (error) {
      console.error("Error actualizando temporada:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Ya existe una temporada con ese nombre." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { success: false, message: "No se pudo actualizar la temporada." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, season: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la temporada.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}