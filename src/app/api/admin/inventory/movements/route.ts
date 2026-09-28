import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { attachUserNames } from "@/lib/inventory/user-names";
import { listMovementsQuerySchema } from "@/validations/inventory-queries";

const MOVEMENT_SELECT = "id, inventory_item_id, lot_id, movement_type, quantity, reference_type, reference_id, reason, created_by, created_at, inventory_item:inventory_items(name, unit)";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = listMovementsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Filtros del historial inválidos." },
        { status: 400 },
      );
    }

    const { inventory_item_id, movement_type, limit, offset } = result.data;

    const supabase = await createClient();
    // El desempate por id hace estable la paginación: los movimientos creados
    // en una misma transacción comparten created_at.
    let query = supabase
      .from("inventory_movements")
      .select(MOVEMENT_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (inventory_item_id) {
      query = query.eq("inventory_item_id", inventory_item_id);
    }
    if (movement_type) {
      query = query.eq("movement_type", movement_type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error obteniendo movimientos:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo obtener el historial de movimientos." },
        { status: 500 },
      );
    }

    const movements = await attachUserNames(data ?? []);

    return NextResponse.json({ success: true, movements, total: count ?? 0, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}