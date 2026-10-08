import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();
    const client = await createClient();
    const { data, error } = await client.from("business_hours").select("day_of_week, opens_at, closes_at, is_closed").order("day_of_week");
    if (error) return NextResponse.json({ success: false, message: "No se pudieron leer los horarios." }, { status: 500 });
    return NextResponse.json({ success: true, hours: data });
  } catch { return NextResponse.json({ success: false, message: "Administrador activo requerido." }, { status: 403 }); }
}
