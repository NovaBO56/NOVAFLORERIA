import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const roleSchema = z.object({
  role: z.enum(["administrador", "empleado"]),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();
    const result = roleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Rol de usuario inválido.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        role: result.data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, full_name, role, is_active, updated_at")
      .single();

    if (error || !data) {
      console.error("Error actualizando rol del usuario:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo actualizar el rol del usuario.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}