import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { updateInventoryItemSchema } from "@/validations/inventory";

const ITEM_SELECT =
  "id, name, sku, item_type, unit, current_stock, minimum_stock, is_active, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEmployeeOrAdmin();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, message: "Ítem no válido." }, { status: 400 });
    }

    const body = await request.json();
    const result = updateInventoryItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...result.data };
    if (updates.sku !== undefined) {
      updates.sku = (updates.sku as string | null) || null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", id)
      .select(ITEM_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "Ya existe un ítem con ese SKU." },
          { status: 409 },
        );
      }
      if (error.code === "PGRST116") {
        return NextResponse.json({ success: false, message: "El ítem no existe." }, { status: 404 });
      }
      console.error("Error actualizando ítem de inventario:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo actualizar el ítem." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}