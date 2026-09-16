import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createInventoryAdjustmentSchema } from "@/validations/inventory";

const ADJUSTMENT_SELECT = "id, inventory_item_id, quantity_delta, reason, created_by, created_at";

export async function GET(request: Request) {
  try {
    await requireEmployeeOrAdmin();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("inventory_item_id");

    const supabase = await createClient();
    let query = supabase
      .from("inventory_adjustments")
      .select(ADJUSTMENT_SELECT)
      .order("created_at", { ascending: false });

    if (itemId) {
      query = query.eq("inventory_item_id", itemId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo ajustes:", error);
      return NextResponse.json({ success: false, message: "No se pudieron obtener los ajustes." }, { status: 500 });
    }

    return NextResponse.json({ success: true, adjustments: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireEmployeeOrAdmin();

    const body = await request.json();
    const result = createInventoryAdjustmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0]?.message ?? "Datos de ajuste inválidos." },
        { status: 400 },
      );
    }

    const { inventory_item_id, quantity_delta, reason } = result.data;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory_adjustments")
      .insert({ inventory_item_id, quantity_delta, reason, created_by: profile.id })
      .select(ADJUSTMENT_SELECT)
      .single();

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error registrando ajuste:", error);
      return NextResponse.json({ success: false, message: "No se pudo registrar el ajuste." }, { status: 500 });
    }

    return NextResponse.json({ success: true, adjustment: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el ajuste.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}