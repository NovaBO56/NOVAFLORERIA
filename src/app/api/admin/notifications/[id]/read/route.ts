import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const profile = await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_by: profile.id, read_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, is_read")
      .maybeSingle();

    if (error) {
      console.error("Error marcando notificación como leída:", error);
      return NextResponse.json({ success: false, message: "No se pudo marcar como leída." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "La notificación no existe." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}