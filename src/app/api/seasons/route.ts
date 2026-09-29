import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seasons")
      .select("id, name, description, starts_at, ends_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo temporadas públicas:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las temporadas." }, { status: 500 });
    }

    return NextResponse.json({ success: true, seasons: data });
  } catch (error) {
    console.error("Error inesperado obteniendo temporadas:", error);
    return NextResponse.json({ success: false, message: "No se pudieron obtener las temporadas." }, { status: 500 });
  }
}   