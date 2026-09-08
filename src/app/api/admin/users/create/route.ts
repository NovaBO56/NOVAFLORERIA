import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().trim().min(1).max(100),
  role: z.enum(["administrador", "empleado"]),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos de usuario inválidos.",
        },
        { status: 400 },
      );
    }

    const { email, password, full_name, role } = result.data;
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (error || !data.user) {
      console.error("Error creando usuario:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear el usuario.",
        },
        { status: 400 },
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("Error configurando perfil:", profileError);

      await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo configurar el perfil del usuario.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name,
          role,
          is_active: true,
        },
      },
      { status: 201 },
    );
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