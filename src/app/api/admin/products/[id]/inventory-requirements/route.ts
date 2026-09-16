import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { addRequirementSchema } from "@/validations/product-recipe";

type RouteContext = { params: Promise<{ id: string }> };

const REQUIREMENT_SELECT = `
  id, product_id, inventory_item_id, quantity, created_at,
  inventory_item:inventory_items (id, name, unit, current_stock, item_type)
`;

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_inventory_requirements")
      .select(REQUIREMENT_SELECT)
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo la receta del producto:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo obtener la receta del producto." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, requirements: data });
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
    const result = addRequirementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de receta inválidos." },
        { status: 400 },
      );
    }

    const { inventory_item_id, quantity } = result.data;
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
      .from("product_inventory_requirements")
      .insert({ product_id: id, inventory_item_id, quantity })
      .select(REQUIREMENT_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Este producto ya tiene ese ítem en su receta. Edítalo en vez de duplicarlo." },
          { status: 409 },
        );
      }
      if (error.code === "23503") {
        return NextResponse.json(
          { success: false, message: "El ítem de inventario no existe." },
          { status: 400 },
        );
      }
      console.error("Error agregando ingrediente a la receta:", error);
      return NextResponse.json({ success: false, message: "No se pudo agregar el ingrediente." }, { status: 500 });
    }

    return NextResponse.json({ success: true, requirement: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo agregar el ingrediente.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}