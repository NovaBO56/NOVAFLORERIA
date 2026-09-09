import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, is_active, created_at, updated_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo categorías:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron obtener las categorías.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      categories: data,
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

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

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

    if (description && description.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "La descripción de la categoría es demasiado larga.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        description: description || null,
      })
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

      console.error("Error creando categoría:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear la categoría.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        category: data,
      },
      { status: 201 },
    );
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