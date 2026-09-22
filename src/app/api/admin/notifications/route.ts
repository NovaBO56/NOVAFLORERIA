import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const supabase = await createClient();
    let query = supabase
      .from("notifications")
      .select("id, type, message, reference_type, reference_id, is_read, read_by, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo notificaciones:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las notificaciones." }, { status: 500 });
    }

    return NextResponse.json({ success: true, notifications: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}