import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES = ["confirmado", "en_preparacion", "listo", "finalizado"];

export async function GET() {
  try {
    await requireEmployeeOrAdmin();
    const supabase = await createClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Ventas de hoy
    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", todayStart.toISOString())
      .in("status", ACTIVE_STATUSES);

    if (todayOrdersError) {
      console.error("Error obteniendo ventas de hoy:", todayOrdersError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    const ventas_hoy = (todayOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

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
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from("inventory_items")
      .select("name, current_stock, minimum_stock")
      .eq("is_active", true);

    if (inventoryError) {
      console.error("Error obteniendo inventario:", inventoryError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

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

    const { data: customersWithBirthday, error: birthdayError } = await supabase
      .from("customers")
      .select("name, birthday")
      .not("birthday", "is", null);

    if (birthdayError) {
      console.error("Error obteniendo cumpleaños:", birthdayError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    const today = new Date();
    const cumpleanos_hoy = (customersWithBirthday ?? [])
      .filter((c) => {
        if (!c.birthday) return false;
        const b = new Date(c.birthday);
        return b.getUTCMonth() === today.getUTCMonth() && b.getUTCDate() === today.getUTCDate();
      })
      .map((c) => ({ name: c.name, birthday: c.birthday }));

    // 7. Productos más vendidos (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", thirtyDaysAgo)
      .in("status", ACTIVE_STATUSES);

    if (recentOrdersError) {
      console.error("Error obteniendo pedidos recientes:", recentOrdersError);
      return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
    }

    const recentOrderIds = (recentOrders ?? []).map((o) => o.id);
    let productos_mas_vendidos: { name: string; quantity: number }[] = [];

    if (recentOrderIds.length > 0) {
      const { data: recentOrderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_name_snapshot, quantity")
        .in("order_id", recentOrderIds);

      if (itemsError) {
        console.error("Error obteniendo productos vendidos:", itemsError);
        return NextResponse.json({ success: false, message: "No se pudo generar el dashboard." }, { status: 500 });
      }

      const totals = new Map<string, number>();
      for (const item of recentOrderItems ?? []) {
        const key = item.product_name_snapshot;
        totals.set(key, (totals.get(key) ?? 0) + Number(item.quantity));
      }

      productos_mas_vendidos = Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));
    }

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
    const message = error instanceof Error ? error.message : "Acceso no autorizado.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}