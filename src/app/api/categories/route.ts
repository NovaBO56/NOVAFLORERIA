import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo categorías públicas:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener las categorías." }, { status: 500 });
    }

    return NextResponse.json({ success: true, categories: data });
  } catch (error) {
    console.error("Error inesperado obteniendo categorías:", error);
    return NextResponse.json({ success: false, message: "No se pudieron obtener las categorías." }, { status: 500 });
  }
}