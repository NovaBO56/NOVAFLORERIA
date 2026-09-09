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
          message: "Categoría no válida.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const updates: {
      name?: string;
      description?: string | null;
      is_active?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre de la categoría no es válido.",
          },
          { status: 400 },
        );
      }

      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre de la categoría es obligatorio.",
          },
          { status: 400 },
        );
      }

      if (name.length > 120) {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre de la categoría es demasiado largo.",
          },
          { status: 400 },
        );
      }

      updates.name = name;
    }

    if (body.description !== undefined) {
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
          : null;

      if (description && description.length > 500) {
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

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "El estado de la categoría no es válido.",
          },
          { status: 400 },
        );
      }

      updates.is_active = body.is_active;
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
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select("id, name, description, is_active, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "Ya existe una categoría con ese nombre.",
          },
          { status: 409 },
        );
      }

      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            message: "La categoría no existe.",
          },
          { status: 404 },
        );
      }

      console.error("Error actualizando categoría:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo actualizar la categoría.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Acceso no autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}