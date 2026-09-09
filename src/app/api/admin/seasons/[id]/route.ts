
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "El identificador de la temporada es obligatorio.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const updates: {
      name?: string;
      description?: string | null;
      starts_at?: string | null;
      ends_at?: string | null;
      is_active?: boolean;
    } = {};

    if ("name" in body) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre de la temporada no es válido.",
          },
          { status: 400 },
        );
      }

      const name = body.name.trim();

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
            message:
              "El nombre de la temporada es demasiado largo.",
          },
          { status: 400 },
        );
      }

      updates.name = name;
    }

    if ("description" in body) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "La descripción no es válida.",
          },
          { status: 400 },
        );
      }

      const description =
        typeof body.description === "string"
          ? body.description.trim()
          : "";

      if (description.length > 500) {
        return NextResponse.json(
          {
            success: false,
            message: "La descripción es demasiado larga.",
          },
          { status: 400 },
        );
      }

      updates.description = description || null;
    }

    if ("starts_at" in body) {
      if (
        body.starts_at !== null &&
        typeof body.starts_at !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "La fecha de inicio no es válida.",
          },
          { status: 400 },
        );
      }

      updates.starts_at = body.starts_at || null;
    }

    if ("ends_at" in body) {
      if (
        body.ends_at !== null &&
        typeof body.ends_at !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "La fecha de finalización no es válida.",
          },
          { status: 400 },
        );
      }

      updates.ends_at = body.ends_at || null;
    }

    if ("is_active" in body) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "El estado de la temporada no es válido.",
          },
          { status: 400 },
        );
      }

      updates.is_active = body.is_active;
    }

    const startsAt =
      "starts_at" in updates
        ? updates.starts_at
        : undefined;

    const endsAt =
      "ends_at" in updates
        ? updates.ends_at
        : undefined;

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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No hay cambios para actualizar.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("seasons")
      .update(updates)
      .eq("id", id)
      .select(
        "id, name, description, starts_at, ends_at, is_active, created_at, updated_at",
      )
      .single();

    if (error) {
      console.error("Error actualizando temporada:", error);

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
          message: "No se pudo actualizar la temporada.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      season: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar la temporada.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}
