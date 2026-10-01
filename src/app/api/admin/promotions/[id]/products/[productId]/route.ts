import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updatePromotionProductSchema } from "@/validations/promotions";

type RouteContext = { params: Promise<{ id: string; productId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, productId } = await context.params;

    const body = await request.json();
    const result = updatePromotionProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Cantidad inválida." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotion_products")
      .update({ quantity: result.data.quantity })
      .eq("promotion_id", id)
      .eq("product_id", productId)
      .select("product_id, quantity")
      .maybeSingle();

    if (error) {
      console.error("Error actualizando producto de la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo actualizar el producto." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "Ese producto no está en la promoción." }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, productId } = await context.params;

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("promotion_products")
      .delete({ count: "exact" })
      .eq("promotion_id", id)
      .eq("product_id", productId);

    if (error) {
      console.error("Error quitando producto de la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo quitar el producto." }, { status: 500 });
    }
    if (!count) {
      return NextResponse.json({ success: false, message: "Ese producto no está en la promoción." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Producto quitado de la promoción." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}