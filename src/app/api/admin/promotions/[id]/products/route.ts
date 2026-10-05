import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  findFixedDiscountViolation,
  fixedDiscountMessage,
} from "@/lib/promotions/fixed-discount";
import { addPromotionProductSchema } from "@/validations/promotions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotion_products")
      .select("product_id, quantity, product:products(id, name, price)")
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { success: false, message: "El identificador de la promoción no es válido." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 },
      );
    }

    const result = addPromotionProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Producto no válido." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // --------------------------------------------------------
    // Regla: en una promoción de producto con MONTO FIJO, el
    // descuento no puede superar el precio del producto que se
    // agrega (el cliente se lo llevaría gratis).
    // --------------------------------------------------------

    const { data: promotion, error: promotionError } = await supabase
      .from("promotions")
      .select("promotion_type, discount_type, discount_value")
      .eq("id", id)
      .maybeSingle();

    if (promotionError) {
      console.error("Error obteniendo la promoción:", promotionError);
      return NextResponse.json(
        { success: false, message: "No se pudo verificar la promoción." },
        { status: 500 },
      );
    }

    if (!promotion) {
      return NextResponse.json(
        { success: false, message: "La promoción no existe." },
        { status: 404 },
      );
    }

    if (
      promotion.promotion_type === "producto" &&
      promotion.discount_type === "monto_fijo" &&
      promotion.discount_value !== null
    ) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name, price")
        .eq("id", result.data.product_id)
        .maybeSingle();

      if (productError) {
        console.error("Error obteniendo el producto:", productError);
        return NextResponse.json(
          { success: false, message: "No se pudo verificar el producto." },
          { status: 500 },
        );
      }

      if (!product) {
        return NextResponse.json(
          { success: false, message: "El producto no existe." },
          { status: 404 },
        );
      }

      const discountValue = Number(promotion.discount_value);
      const violation = findFixedDiscountViolation(discountValue, [
        { name: product.name as string, price: Number(product.price) },
      ]);

      if (violation) {
        return NextResponse.json(
          { success: false, message: fixedDiscountMessage(discountValue, violation) },
          { status: 400 },
        );
      }
    }

    const { error } = await supabase
      .from("promotion_products")
      .insert({ promotion_id: id, product_id: result.data.product_id, quantity: result.data.quantity });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, message: "Ese producto ya está en la promoción." }, { status: 409 });
      }
      console.error("Error agregando producto a la promoción:", error);
      return NextResponse.json({ success: false, message: "No se pudo agregar el producto." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error inesperado agregando producto a la promoción:", error);
    return NextResponse.json({ success: false, message: "No se pudo agregar el producto." }, { status: 500 });
  }
}