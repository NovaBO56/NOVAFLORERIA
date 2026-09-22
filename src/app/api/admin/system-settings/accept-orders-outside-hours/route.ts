import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateAcceptOrdersOutsideHoursSchema } from "@/validations/notifications-and-hours";

export async function PATCH(request: Request) {
  try {
    const profile = await requireAdmin();

    const body = await request.json();
    const result = updateAcceptOrdersOutsideHoursSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("system_settings")
      .update({
        value: { enabled: result.data.enabled },
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq("key", "accept_orders_outside_hours")
      .select("key, value, updated_at")
      .maybeSingle();

    if (error) {
      console.error("Error actualizando configuración:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar la configuración." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "La configuración no existe." }, { status: 404 });
    }

    return NextResponse.json({ success: true, setting: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}