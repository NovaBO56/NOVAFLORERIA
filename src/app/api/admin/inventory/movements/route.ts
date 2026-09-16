import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const MOVEMENT_SELECT =
  "id, inventory_item_id, lot_id, movement_type, quantity, reference_type, reference_id, reason, created_by, created_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("inventory_item_id");
    const movementType = searchParams.get("movement_type");

    const supabase = await createClient();
    let query = supabase
      .from("inventory_movements")
      .select(MOVEMENT_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);

    if (itemId) {
      query = query.eq("inventory_item_id", itemId);
    }
    if (movementType) {
      query = query.eq("movement_type", movementType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo movimientos:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo obtener el historial de movimientos." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, movements: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}