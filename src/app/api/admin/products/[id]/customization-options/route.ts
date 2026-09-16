import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createCustomizationOptionSchema } from "@/validations/product-recipe";

type RouteContext = { params: Promise<{ id: string }> };

const OPTION_SELECT = "id, product_id, option_type, name, value, extra_price, is_active, created_at";

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("customization_options")
      .select(OPTION_SELECT)
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo opciones de personalización:", error);
      return NextResponse.json(
        { success: false, message: "No se pudieron obtener las opciones de personalización." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, options: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const result = createCustomizationOptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de personalización inválidos." },
        { status: 400 },
      );
    }

    const { option_type, name, value, extra_price } = result.data;
    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from("products").select("id").eq("id", id).maybeSingle();

    if (productError) {
      console.error("Error verificando producto:", productError);
      return NextResponse.json({ success: false, message: "No se pudo verificar el producto." }, { status: 500 });
    }
    if (!product) {
      return NextResponse.json({ success: false, message: "El producto no existe." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("customization_options")
      .insert({ product_id: id, option_type, name, value: value || null, extra_price })
      .select(OPTION_SELECT)
      .single();

    if (error) {
      console.error("Error creando opción de personalización:", error);
      return NextResponse.json({ success: false, message: "No se pudo crear la opción." }, { status: 500 });
    }

    return NextResponse.json({ success: true, option: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la opción.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}