import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

import { businessDate, businessDayStart } from "@/lib/business-date";

import { readAllPages } from "@/lib/db/read-all-pages";
import { sumMoney } from "@/lib/money";

const ACTIVE_STATUSES = ["confirmado", "en_preparacion", "listo", "finalizado"];

export async function GET() {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const todayStart = businessDayStart();

    // 1. Ventas de hoy
    const todayOrders = await readAllPages<{ total: number }>((start, end) => supabase
      .from("orders")
      .select("total", { count: "exact" })
      .gte("created_at", todayStart.toISOString())
      .in("status", ACTIVE_STATUSES).order("id", { ascending: true }).range(start, end));

    const ventas_hoy = sumMoney(todayOrders.map(order => order.total));

    // 2. Pedidos pendientes de pago
    const { count: pedidos_pendientes, error: pendingOrdersError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendiente_pago");

    if (pendingOrdersError) {
      console.error("Error obteniendo pedidos pendientes:", pendingOrdersError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    // 3. Pagos pendientes de verificación
    const { count: pagos_pendientes, error: pendingPaymentsError } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendiente");

    if (pendingPaymentsError) {
      console.error("Error obteniendo pagos pendientes:", pendingPaymentsError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    // 4. Alertas de inventario
    const inventoryItems = await readAllPages<{ name: string; current_stock: number; minimum_stock: number }>((start, end) => supabase
      .from("inventory_items")
      .select("name, current_stock, minimum_stock", { count: "exact" })
      .eq("is_active", true).order("id", { ascending: true }).range(start, end));

    const bajo_stock = (inventoryItems ?? [])
      .filter((i) => Number(i.current_stock) > 0 && Number(i.current_stock) <= Number(i.minimum_stock))
      .map((i) => ({ name: i.name, current_stock: i.current_stock, minimum_stock: i.minimum_stock }));

    const agotados = (inventoryItems ?? [])
      .filter((i) => Number(i.current_stock) <= 0)
      .map((i) => ({ name: i.name }));

    // 5. Estado de caja
    const { data: openSession, error: sessionError } = await supabase
      .from("cash_sessions")
      .select("opening_amount, opened_at")
      .eq("status", "abierta")
      .maybeSingle();

    if (sessionError) {
      console.error("Error obteniendo estado de caja:", sessionError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    // 6. Clientes totales y cumpleaños de hoy
    const { count: clientes_total, error: customersError } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });

    if (customersError) {
      console.error("Error obteniendo clientes:", customersError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    const customersWithBirthday = await readAllPages<{ name: string; birthday: string }>((start, end) => supabase
      .from("customers")
      .select("name, birthday", { count: "exact" })
      .not("birthday", "is", null).order("id", { ascending: true }).range(start, end));

    const today = businessDate();
    const cumpleanos_hoy = (customersWithBirthday ?? [])
      .filter((c) => {
        if (!c.birthday) return false;
        const b = new Date(c.birthday);
        return b.toISOString().slice(5, 10) === today.slice(5, 10);
      })
      .map((c) => ({ name: c.name, birthday: c.birthday }));

    // 7. Productos más vendidos (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const recentOrderItems = await readAllPages<{ product_name_snapshot: string; quantity: number }>((start, end) => supabase
      .from("order_items")
      .select("id, product_name_snapshot, quantity, order:orders!inner(status, created_at)", { count: "exact" })
      .gte("order.created_at", thirtyDaysAgo)
      .in("order.status", ACTIVE_STATUSES)
      .order("id", { ascending: true }).range(start, end));
    const totals = new Map<string, number>();
    for (const item of recentOrderItems) {
      totals.set(item.product_name_snapshot, (totals.get(item.product_name_snapshot) ?? 0) + Math.round(Number(item.quantity) * 1000));
    }
    const productos_mas_vendidos = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity: quantity / 1000 }));

    return NextResponse.json({
      success: true,
      dashboard: {
        ventas_hoy,
        pedidos_pendientes: pedidos_pendientes ?? 0,
        pagos_pendientes: pagos_pendientes ?? 0,
        inventario: { bajo_stock, agotados },
        caja: openSession
          ? { abierta: true, opening_amount: openSession.opening_amount, opened_at: openSession.opened_at }
          : { abierta: false },
        clientes_total: clientes_total ?? 0,
        cumpleanos_hoy,
        productos_mas_vendidos,
      },
    });
  } catch (error) {
    console.error("Error consultando datos administrativos:", error);
    const message = error instanceof Error ? error.message : "";
    const unauthorized = /^(Usuario|Rol|Acceso)/.test(message);
    return NextResponse.json({ success: false, message: unauthorized ? message : "No se pudieron obtener los datos." }, { status: unauthorized ? 403 : 500 });
  }
}
