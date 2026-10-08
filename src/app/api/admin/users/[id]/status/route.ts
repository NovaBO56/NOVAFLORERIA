import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const statusSchema = z.object({
  is_active: z.boolean(),
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
    const actor = await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();
    const result = statusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Estado de usuario inválido.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc("update_staff_profile", {
      p_actor: actor.id, p_user: id, p_active: result.data.is_active,
    });

    if (error?.code === "P0001") return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    if (error || !data) {
      console.error("Error actualizando estado del usuario:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo actualizar el estado del usuario.",
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