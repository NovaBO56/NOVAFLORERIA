import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { listLotsQuerySchema } from "@/validations/inventory-queries";

const LOT_SELECT = "id, inventory_entry_id, inventory_item_id, initial_quantity, remaining_quantity, received_at, created_at, inventory_item:inventory_items(name, unit, item_type), entry:inventory_entries(supplier_name)";
// Solo lectura: los lotes nacen automáticamente de una entrada (trigger), nunca se crean a mano.
export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const result = listLotsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Filtros de lotes inválidos." },
        { status: 400 },
      );
    }

    const { inventory_item_id, only_available, limit } = result.data;
    const supabase = await createClient();

    // Orden FIFO: el más antiguo primero (mismo criterio que usa el consumo de stock).
    let query = supabase
      .from("inventory_lots")
      .select(LOT_SELECT)
      .order("received_at", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (inventory_item_id) {
      query = query.eq("inventory_item_id", inventory_item_id);
    }
    if (only_available === "true") {
      query = query.gt("remaining_quantity", 0);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo lotes:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los lotes." }, { status: 500 });
    }

    // fifo_next = el lote que se consumirá primero para ese ítem.
    // Solo es confiable con only_available=true (el valor por defecto).
    const seenItems = new Set<string>();
    const lots = (data ?? []).map((lot: { inventory_item_id: string; remaining_quantity: number | string }) => {
      let fifo_next = false;
      if (Number(lot.remaining_quantity) > 0 && !seenItems.has(lot.inventory_item_id)) {
        seenItems.add(lot.inventory_item_id);
        fifo_next = true;
      }
      return { ...lot, fifo_next };
    });

    return NextResponse.json({ success: true, lots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}