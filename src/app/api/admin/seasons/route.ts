import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createSeasonSchema } from "@/validations/seasons";

const SEASON_SELECT = "id, name, description, starts_at, ends_at, is_active, created_at, updated_at";

export async function GET() {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("seasons")
      .select(SEASON_SELECT)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo temporadas:", error);
      return NextResponse.json(
        { success: false, message: "No se pudieron obtener las temporadas." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, seasons: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createSeasonSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de temporada inválidos." },
        { status: 400 },
      );
    }

    const { name, description, starts_at, ends_at } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("seasons")
      .insert({
        name,
        description: description || null,
        starts_at: starts_at || null,
        ends_at: ends_at || null,
      })
      .select(SEASON_SELECT)
      .single();

    if (error) {
      console.error("Error creando temporada:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Ya existe una temporada con ese nombre." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { success: false, message: "No se pudo crear la temporada." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, season: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la temporada.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}