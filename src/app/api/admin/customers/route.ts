import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createCustomerSchema } from "@/validations/promotions";

const CUSTOMER_SELECT =
  "id, name, phone, whatsapp, email, birthday, is_active, created_at, updated_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = await createClient();

    let query = supabase
      .from("customers")
      .select(CUSTOMER_SELECT)
      .order("name", { ascending: true });

    if (search?.trim()) {
      const value = search.trim();

      query = query.or(
        `name.ilike.%${value}%,phone.ilike.%${value}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo clientes:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron obtener los clientes.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      customers: data ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Acceso no autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();

    const result = createCustomerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ??
            "Datos inválidos.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customers")
      .insert(result.data)
      .select(CUSTOMER_SELECT)
      .single();

    if (error) {
      console.error("Error creando cliente:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo crear el cliente.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        customer: data,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Acceso no autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}