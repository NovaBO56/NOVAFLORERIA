import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cash_registers")
      .select("id, name, is_active, created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo cajas:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las cajas." }, { status: 500 });
    }

    return NextResponse.json({ success: true, registers: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}