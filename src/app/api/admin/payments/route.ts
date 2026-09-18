import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const PAYMENT_SELECT = `
  id, order_id, method, amount, status, reference, rejection_reason,
  confirmed_by, confirmed_at, rejected_by, rejected_at, created_at, updated_at,
  order:orders (id, order_number, customer:customers (name, phone))
`;

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = await createClient();
    let query = supabase.from("payments").select(PAYMENT_SELECT).order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo pagos:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los pagos." }, { status: 500 });
    }

    return NextResponse.json({ success: true, payments: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}