import { NextResponse } from "next/server";
import { requireAdmin, requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { addPromotionCustomerSchema } from "@/validations/promotions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotion_customers")
      .select("customer_id, customer:customers(id, name, phone)")
      .eq("promotion_id", id);

    if (error) {
      console.error("Error obteniendo clientes de la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los clientes." }, { status: 500 });
    }

    return NextResponse.json({ success: true, customers: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = addPromotionCustomerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Cliente no válido." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("promotion_customers")
      .insert({ promotion_id: id, customer_id: result.data.customer_id });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, message: "Ese cliente ya está en la promoción." }, { status: 409 });
      }
      console.error("Error agregando cliente a la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo agregar el cliente." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}