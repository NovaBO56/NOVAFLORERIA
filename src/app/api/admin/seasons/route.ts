
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("seasons")
      .select(
        "id, name, description, starts_at, ends_at, is_active, created_at, updated_at",
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo temporadas:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron obtener las temporadas.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      seasons: data,
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

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const startsAt =
      typeof body.starts_at === "string" && body.starts_at
        ? body.starts_at
        : null;

    const endsAt =
      typeof body.ends_at === "string" && body.ends_at
        ? body.ends_at
        : null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre de la temporada es obligatorio.",
        },
        { status: 400 },
      );
    }

    if (name.length > 120) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre de la temporada es demasiado largo.",
        },
        { status: 400 },
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "La descripción es demasiado larga.",
        },
        { status: 400 },
      );
    }

    if (startsAt && endsAt) {
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Las fechas de la temporada no son válidas.",
          },
          { status: 400 },
        );
      }

      if (startDate >= endDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "La fecha de inicio debe ser anterior a la fecha de finalización.",
          },
          { status: 400 },
        );
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("seasons")
      .insert({
        name,
        description: description || null,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select(
        "id, name, description, starts_at, ends_at, is_active, created_at, updated_at",
      )
      .single();

    if (error) {
      console.error("Error creando temporada:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "Ya existe una temporada con ese nombre.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear la temporada.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        season: data,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear la temporada.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}
