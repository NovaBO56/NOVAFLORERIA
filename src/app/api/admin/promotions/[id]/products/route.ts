import { NextResponse } from "next/server";
import { requireAdmin, requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { addPromotionProductSchema } from "@/validations/promotions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotion_products")
      .select("product_id, product:products(id, name, price)")
      .eq("promotion_id", id);

    if (error) {
      console.error("Error obteniendo productos de la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los productos." }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: data });
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
    const result = addPromotionProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Producto no válido." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("promotion_products")
      .insert({ promotion_id: id, product_id: result.data.product_id });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, message: "Ese producto ya está en la promoción." }, { status: 409 });
      }
      console.error("Error agregando producto a la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo agregar el producto." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}