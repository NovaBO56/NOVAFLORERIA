import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateCustomerSchema } from "@/validations/promotions";

const CUSTOMER_SELECT = "id, name, phone, whatsapp, email, birthday, is_active, created_at, updated_at";
const ORDER_SELECT = "id, order_number, order_type, status, total, created_at";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select(CUSTOMER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (customerError) {
      console.error("Error obteniendo cliente:", customerError);
      return NextResponse.json({ success: false, message: "No se pudo obtener el cliente." }, { status: 500 });
    }
    if (!customer) {
      return NextResponse.json({ success: false, message: "El cliente no existe." }, { status: 404 });
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error obteniendo historial del cliente:", ordersError);
      return NextResponse.json({ success: false, message: "No se pudo obtener el historial." }, { status: 500 });
    }

    return NextResponse.json({ success: true, customer, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = updateCustomerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...result.data };
    for (const key of ["phone", "whatsapp", "email", "birthday"] as const) {
      if (updates[key] !== undefined) {
        updates[key] = (updates[key] as string | null) || null;
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select(CUSTOMER_SELECT)
      .maybeSingle();

    if (error) {
      console.error("Error actualizando cliente:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar el cliente." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "El cliente no existe." }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}