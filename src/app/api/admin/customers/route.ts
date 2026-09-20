import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const CUSTOMER_SELECT = "id, name, phone, whatsapp, email, birthday, is_active, created_at, updated_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = await createClient();
    let query = supabase.from("customers").select(CUSTOMER_SELECT).order("name", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo clientes:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los clientes." }, { status: 500 });
    }

    return NextResponse.json({ success: true, customers: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}