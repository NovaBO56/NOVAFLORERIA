import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const componentSelect = `
  id,
  parent_product_id,
  component_product_id,
  quantity,
  created_at,
  component_product:products!product_components_component_product_id_fkey (
    id,
    name,
    price,
    is_active,
    is_available,
    is_sold_out
  )
`;

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_components")
      .select(componentSelect)
      .eq("parent_product_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo componentes:", error);

      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron obtener los componentes del producto.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      components: data,
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

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();

    const componentProductId =
      typeof body.component_product_id === "string"
        ? body.component_product_id.trim()
        : "";

    const quantity =
      typeof body.quantity === "number"
        ? body.quantity
        : Number(body.quantity);

    if (!componentProductId) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto componente es obligatorio.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "La cantidad debe ser mayor que cero.",
        },
        { status: 400 },
      );
    }

    if (id === componentProductId) {
      return NextResponse.json(
        {
          success: false,
          message: "Un producto no puede ser componente de sí mismo.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: parentProduct, error: parentError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (parentError) {
      console.error(
        "Error verificando producto padre:",
        parentError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo verificar el producto principal.",
        },
        { status: 500 },
      );
    }

    if (!parentProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto principal no existe.",
        },
        { status: 404 },
      );
    }

    const { data: componentProduct, error: componentError } =
      await supabase
        .from("products")
        .select("id")
        .eq("id", componentProductId)
        .maybeSingle();

    if (componentError) {
      console.error(
        "Error verificando producto componente:",
        componentError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo verificar el producto componente.",
        },
        { status: 500 },
      );
    }

    if (!componentProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto componente no existe.",
        },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("product_components")
      .insert({
        parent_product_id: id,
        component_product_id: componentProductId,
        quantity,
      })
      .select(componentSelect)
      .single();

    if (error) {
      console.error("Error agregando componente:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Ese producto ya está agregado como componente.",
          },
          { status: 409 },
        );
      }

      if (error.code === "23514") {
        return NextResponse.json(
          {
            success: false,
            message:
              "La combinación de productos no es válida.",
          },
          { status: 400 },
        );
      }

      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            message:
              "El producto principal o componente no existe.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo agregar el componente.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        component: data,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo agregar el componente.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 403 },
    );
  }
}