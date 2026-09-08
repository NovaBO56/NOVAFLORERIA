import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo usuarios:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron obtener los usuarios.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      users: data,
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