import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = await createClient();
    let query = supabase
      .from("order_deletion_requests")
      .select(
        "id, order_id, requested_by, reason, status, reviewed_by, reviewed_at, review_reason, created_at, order:orders(order_number, status, total)",
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo solicitudes de eliminación:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las solicitudes." }, { status: 500 });
    }

    return NextResponse.json({ success: true, requests: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}