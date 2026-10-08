import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditTrailQuerySchema } from "@/validations/audit";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const result = auditTrailQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      user_id: searchParams.get("user_id") ?? undefined,
      table: searchParams.get("table") ?? undefined,
      action: searchParams.get("action") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ?? "Parámetros inválidos.",
        },
        { status: 400 },
      );
    }

    const { limit, offset, from, to, user_id, table, action } = result.data;
    // Service view is read only here, after active-administrator authorization.
    const supabase = createAdminClient();
    let query = supabase.from("audit_trail").select("*").order("created_at", { ascending: false }).order("table_name").order("record_id").range(offset, offset+limit-1);
    if (from) query=query.gte("created_at", from+"T00:00:00-04:00");
    if (to) query=query.lte("created_at", to+"T23:59:59.999999-04:00");
    if (user_id) query=query.eq("user_id",user_id);
    if (table) query=query.eq("table_name",table);
    if (action) query=query.eq("action",action);
    const { data, error } = await query;
    if (error) {
      console.error("Error obteniendo el historial de auditoría:", error);
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo obtener el historial de auditoría.",
        },
        { status: 500 },
      );
    }

    const entries = data ?? [];
    const ids = (key: string) => [...new Set(entries.map(entry => entry[key]).filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))];
    const userIds = ids("user_id");
    const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id",userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const users = new Map((profiles ?? []).map(profile => [profile.id,profile.full_name]));
    const recordIds = (tableName: string) => [...new Set(entries.filter(entry => !entry.after && entry.table_name === tableName).map(entry => entry.record_id))];
    const paymentIds = recordIds("payments");
    const movementIds = recordIds("inventory_movements");
    const [paymentResult, movementResult] = await Promise.all([
      paymentIds.length ? supabase.from("payments").select("id,order_id,amount,status").in("id",paymentIds) : Promise.resolve({data: [], error: null}),
      movementIds.length ? supabase.from("inventory_movements").select("id,inventory_item_id,quantity,movement_type").in("id",movementIds) : Promise.resolve({data: [], error: null}),
    ]);
    if (paymentResult.error || movementResult.error) throw new Error("No se pudieron resolver los detalles de auditoría.");
    const payments = new Map((paymentResult.data ?? []).map(payment => [payment.id,payment]));
    const movements = new Map((movementResult.data ?? []).map(movement => [movement.id,movement]));
    const resolved = entries.map(entry => {
      let details = entry.after || {}; const before = entry.before || {};
      if (!entry.after && entry.table_name === "payments") {
        details = payments.get(entry.record_id) || {};
      }
      if (!entry.after && entry.table_name === "inventory_movements") {
        details = movements.get(entry.record_id) || {};
      }
      const after = details;
      const itemId = after.inventory_item_id || before.inventory_item_id || (entry.table_name === "inventory_items" ? entry.record_id : null);
      const orderId = after.order_id || before.order_id || (entry.table_name === "orders" ? entry.record_id : null);
      return { entry, details, itemId, orderId };
    });
    const itemIds = [...new Set(resolved.map(row => row.itemId).filter(Boolean))];
    const orderIds = [...new Set(resolved.map(row => row.orderId).filter(Boolean))];
    const [itemResult, orderResult] = await Promise.all([
      itemIds.length ? supabase.from("inventory_items").select("id,name,unit").in("id",itemIds) : Promise.resolve({data: [], error: null}),
      orderIds.length ? supabase.from("orders").select("id,order_number").in("id",orderIds) : Promise.resolve({data: [], error: null}),
    ]);
    if (itemResult.error || orderResult.error) throw new Error("No se pudieron resolver las referencias de auditoría.");
    const items = new Map((itemResult.data ?? []).map(item => [item.id,item]));
    const orders = new Map((orderResult.data ?? []).map(order => [order.id,order]));
    const enriched = resolved.map(({entry,details,itemId,orderId}) => {
      const item=items.get(itemId); const order=orders.get(orderId);
      return { ...entry, presentation_details: details, user_name: users.get(entry.user_id) || null, entity_name: order ? "Pedido #"+order.order_number : item?.name ?? null, unit: item?.unit ?? null };
    });
    return NextResponse.json({ success: true, entries: enriched, users: profiles ?? [] });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo obtener el historial de auditoría.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}
