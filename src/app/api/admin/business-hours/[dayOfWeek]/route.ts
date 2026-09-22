import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateBusinessHoursSchema } from "@/validations/notifications-and-hours";

type RouteContext = { params: Promise<{ dayOfWeek: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const profile = await requireAdmin();
    const { dayOfWeek } = await context.params;

    const day = Number(dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return NextResponse.json({ success: false, message: "Día de la semana no válido (0-6)." }, { status: 400 });
    }

    const body = await request.json();
    const result = updateBusinessHoursSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("business_hours")
      .update({ ...result.data, updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq("day_of_week", day)
      .select("day_of_week, opens_at, closes_at, is_closed")
      .maybeSingle();

    if (error) {
      console.error("Error actualizando horario:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar el horario." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "Día no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, day: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}