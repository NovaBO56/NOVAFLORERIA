import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuidSchema } from "@/validations/database-values";
import { historyProjection } from "@/lib/admin/order-detail";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireEmployeeOrAdmin(); } catch { return NextResponse.json({ success: false, message: "Personal activo requerido." }, { status: 403 }); }
  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ success: false, message: "ID no válido." }, { status: 400 });
  try {
    const client = await createClient();
    const order = await client.from("orders").select("id,payments(id)").eq("id", id).is("deleted_at", null).maybeSingle();
    if (order.error) throw Error();
    if (!order.data) return NextResponse.json({ success: false, message: "El pedido no existe." }, { status: 404 });
    const admin = createAdminClient();
    const fields = "id,table_name,action,created_at,before,after,user_id";
    const ids = (order.data.payments ?? []).map(p => p.id);
    const [orders, payments] = await Promise.all([
      admin.from("audit_logs").select(fields).eq("table_name", "orders").eq("record_id", id).order("created_at", { ascending: false }).limit(100),
      ids.length ? admin.from("audit_logs").select(fields).eq("table_name", "payments").in("record_id", ids).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    ]);
    if (orders.error || payments.error) throw Error();
    const rows = [...orders.data ?? [], ...payments.data ?? []].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const actorIds = [...new Set(rows.flatMap(row => row.user_id ? [row.user_id] : []))];
    const actors = actorIds.length ? await admin.from("profiles").select("id,full_name").in("id", actorIds) : { data: [], error: null };
    if (actors.error) throw Error();
    const entries = rows.flatMap(row => {
      const event = historyProjection(row, actors.data?.find(p => p.id === row.user_id)?.full_name ?? null);
      return event ? [event] : [];
    });
    return NextResponse.json({ success: true, entries: entries.slice(0, 100), limited: rows.length >= 100 });
  } catch { return NextResponse.json({ success: false, message: "No se pudo cargar el historial." }, { status: 500 }); }
}
