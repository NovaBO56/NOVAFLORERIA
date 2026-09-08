
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSystemSettingSchema } from "@/config/system-settings";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value, is_critical, updated_by, created_at, updated_at")
      .order("key", { ascending: true });

    if (error) {
      console.error("Error obteniendo configuración:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo obtener la configuración del sistema.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
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

export async function PATCH(
  request: Request,
) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const parsed = updateSystemSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Los datos de configuración no son válidos.",
        },
        { status: 400 },
      );
    }

    const key = new URL(request.url).searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "Debe indicar la clave de configuración.",
        },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from("system_settings")
      .select("key, value, is_critical")
      .eq("key", key)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        {
          success: false,
          message: "La configuración indicada no existe.",
        },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("system_settings")
      .update({
        value: parsed.data.value,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select("key, value, is_critical, updated_by, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error actualizando configuración:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo actualizar la configuración.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      setting: data,
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
