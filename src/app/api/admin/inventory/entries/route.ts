import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createInventoryEntrySchema } from "@/validations/inventory";

const ENTRY_SELECT =
  "id, inventory_item_id, quantity, unit_cost, supplier_name, notes, received_at, created_by, created_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("inventory_item_id");

    const supabase = await createClient();
    let query = supabase.from("inventory_entries").select(ENTRY_SELECT).order("received_at", { ascending: false });

    if (itemId) {
      query = query.eq("inventory_item_id", itemId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo entradas:", error);
      return NextResponse.json(
        { success: false, message: "No se pudieron obtener las entradas." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, entries: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createInventoryEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de entrada inválidos." },
        { status: 400 },
      );
    }

    const { inventory_item_id, quantity, unit_cost, supplier_name, notes, received_at } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory_entries")
      .insert({
        inventory_item_id,
        quantity,
        unit_cost: unit_cost ?? null,
        supplier_name: supplier_name || null,
        notes: notes || null,
        received_at: received_at || new Date().toISOString(),
        created_by: profile.id,
      })
      .select(ENTRY_SELECT)
      .single();

    if (error) {
      console.error("Error registrando entrada:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo registrar la entrada." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, entry: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar la entrada.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}