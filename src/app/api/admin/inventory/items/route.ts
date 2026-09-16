import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createInventoryItemSchema } from "@/validations/inventory";

const ITEM_SELECT =
  "id, name, sku, item_type, unit, current_stock, minimum_stock, is_active, created_at, updated_at";

function withStockStatus(item: { current_stock: number; minimum_stock: number }) {
  let stock_status: "agotado" | "bajo" | "normal" = "normal";
  if (Number(item.current_stock) <= 0) {
    stock_status = "agotado";
  } else if (Number(item.current_stock) <= Number(item.minimum_stock)) {
    stock_status = "bajo";
  }
  return { ...item, stock_status };
}

export async function GET() {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory_items")
      .select(ITEM_SELECT)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error obteniendo inventario:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo obtener el inventario." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, items: (data ?? []).map(withStockStatus) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createInventoryItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de inventario inválidos." },
        { status: 400 },
      );
    }

    const { name, sku, item_type, unit, minimum_stock } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({ name, sku: sku || null, item_type, unit, minimum_stock })
      .select(ITEM_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Ya existe un ítem con ese SKU." },
          { status: 409 },
        );
      }
      console.error("Error creando ítem de inventario:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo crear el ítem de inventario." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, item: withStockStatus(data) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}