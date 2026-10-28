"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Boxes, Clock3, Flower2, Package, Receipt, RotateCcw, ShoppingBag, ShoppingCart, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, type OrderStatus } from "@/components/ui/badge";
import { formatMoney, formatDateTime } from "@/lib/format";
import { businessDate } from "@/lib/business-date";
import type { SalesEvent, salesTotals } from "@/lib/reports/sales-ledger";
import { OrderStatusDonut, SalesChart } from "./dashboard-charts";

type RecentOrder = { id: string; order_number: number; status: OrderStatus; total: number; created_at: string; customer_name: string | null };
type Dashboard = {
  financial: ReturnType<typeof salesTotals>; today_orders: number; pending_payments: number;
  statuses: Record<string, number>; inventory: { id: string; name: string; current_stock: number; unit: string }[];
  bestsellers: { name: string; quantity: number }[]; activity: SalesEvent[];
  recent_statuses: { id: string; order_number: number; status: string; updated_at: string }[];
  recent_orders: RecentOrder[];
};
function range(days: number) {
  const to = businessDate(), start = new Date(`${to}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { from: start.toISOString().slice(0, 10), to };
}

export function DashboardPanel() {
  const [dates, setDates] = useState(() => range(7));
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch(`/api/admin/dashboard?${new URLSearchParams(dates)}`, { signal: abort.signal });
        const body = await response.json();
        if (!response.ok || !body.success) throw Error(body.message || "No se pudo cargar el dashboard.");
        if (!abort.signal.aborted) setData(body.dashboard);
      } catch (cause) {
        if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar el dashboard.");
      } finally { if (!abort.signal.aborted) setLoading(false); }
    })();
    return () => abort.abort();
  }, [dates, refresh]);

  return <div className="min-w-0 space-y-6" aria-busy={loading}>
    <PageHeader eyebrow="Operación" title="Dashboard" description="Consulta las ventas y detecta los pedidos o insumos que necesitan atención." actions={<Button variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RotateCcw aria-hidden size={16} />Actualizar</Button>} />
    <div className="admin-filter-bar">
      <div className="flex min-w-0 flex-wrap gap-1" aria-label="Rango de ventas">{[1, 7, 30].map(days => {
        const selection = range(days), selected = dates.from === selection.from && dates.to === selection.to;
        return <Button key={days} size="sm" variant={selected ? "secondary" : "ghost"} aria-pressed={selected} onClick={() => setDates(selection)}>{days === 1 ? "Hoy" : days + " días"}</Button>;
      })}</div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Field label="Desde"><Input type="date" value={dates.from} max={dates.to} onChange={event => { if (event.target.value) setDates(current => ({ ...current, from: event.target.value })); }} /></Field>
        <Field label="Hasta"><Input type="date" value={dates.to} min={dates.from} onChange={event => { if (event.target.value) setDates(current => ({ ...current, to: event.target.value })); }} /></Field>
      </div>
      <p className="text-xs text-text-secondary sm:ml-auto">Hora de Bolivia</p>
    </div>
    {error ? <Card><EmptyState icon={<Receipt />} title="No se pudo cargar el resumen" description={error} action={<Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Reintentar</Button>} /></Card> : loading ? <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><span className="sr-only">Cargando dashboard…</span>{[0, 1, 2, 3, 4, 5].map(index => <Card key={index} className="h-32 animate-pulse motion-reduce:animate-none" />)}</div> : data ? <>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Ventas netas" value={"Bs " + formatMoney(data.financial.net_sales)} icon={<BarChart3 />} tone="brand" description="Ventas brutas menos reintegros del período" />
        <StatCard label="Ventas brutas" value={"Bs " + formatMoney(data.financial.gross_sales)} icon={<ShoppingCart />} tone="success" description="Ventas originales confirmadas" />
        <StatCard label="Devoluciones" value={"Bs " + formatMoney(data.financial.refunds)} icon={<Undo2 />} description="Reintegros monetarios del período" />
        <Link href="/admin/pedidos" className="min-w-0 rounded-xl outline-brand focus-visible:outline-2"><StatCard label="Pedidos de hoy" value={String(data.today_orders)} icon={<Receipt />} description="Consulta todos los pedidos de hoy" className="h-full" /></Link>
        <Link href="/admin/pedidos?pago=pendiente" className="min-w-0 rounded-xl outline-brand focus-visible:outline-2"><StatCard label="Pagos pendientes" value={String(data.pending_payments)} icon={<Clock3 />} tone="warning" description="Requieren verificación del pago" className="h-full" /></Link>
        <Link href="/admin/inventario" className="min-w-0 rounded-xl outline-brand focus-visible:outline-2"><StatCard label="Stock crítico" value={String(data.inventory.length)} icon={<Package />} tone={data.inventory.length ? "danger" : "success"} description="Insumos que requieren atención" className="h-full" /></Link>
      </div>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="contents xl:block xl:min-w-0 xl:space-y-6">
          <SectionCard className="order-1" title="Ventas y devoluciones" description={dates.from + " al " + dates.to} action={<Button asChild variant="outline" size="sm"><Link href="/admin/reportes">Ver reportes</Link></Button>}><SalesChart key={dates.from + ":" + dates.to} series={data.financial.series} /></SectionCard>
          <SectionCard className="order-3" title="Pedidos recientes" description="Últimos pedidos recibidos, independientemente del rango de ventas." action={<Button asChild variant="outline" size="sm"><Link href="/admin/pedidos">Ver pedidos</Link></Button>}><RecentOrders orders={data.recent_orders ?? []} /></SectionCard>
          <SectionCard className="order-6" title="Productos más vendidos" description="Unidades originales vendidas en el período.">
            {!data.bestsellers.length ? <EmptyState icon={<Flower2 />} title="Todavía no hay ventas en este período" /> : <ol className="space-y-3">{data.bestsellers.map((item, index) => <li key={item.name + index} className="flex min-w-0 items-center gap-3 rounded-lg bg-bg-admin p-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand">{index + 1}</span><span className="min-w-0 flex-1 break-words text-sm">{item.name}</span><span className="shrink-0 text-sm font-semibold tabular-nums">{item.quantity} u.</span></li>)}</ol>}
          </SectionCard>
        </div>
        <div className="contents xl:block xl:min-w-0 xl:space-y-6">
          <SectionCard className="order-2" title="Estado de pedidos" description="Distribución actual de los pedidos por estado."><OrderStatusDonut statuses={data.statuses} /></SectionCard>
          <SectionCard className="order-4" title="Alertas de inventario" description="Insumos agotados o con existencias bajas." action={<Button asChild variant="outline" size="sm"><Link href="/admin/inventario">Ver inventario</Link></Button>}>
            {!data.inventory.length ? <EmptyState icon={<Boxes />} title="Sin alertas de stock" /> : <ul className="space-y-3">{data.inventory.slice(0, 6).map(item => <li key={item.id} className="flex min-w-0 items-center gap-3 border-b border-border-decorative pb-3 last:border-0 last:pb-0"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700"><Boxes size={20} aria-hidden /></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-text-secondary">{item.current_stock} {item.unit}</p></div><Badge variant="outline" className={Number(item.current_stock) <= 0 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"}>{Number(item.current_stock) <= 0 ? "Agotado" : "Stock bajo"}</Badge></li>)}</ul>}
            {data.inventory.length > 6 && <p className="mt-3 text-xs text-text-secondary">{data.inventory.length} insumos requieren atención. Consulta la lista completa en inventario.</p>}
          </SectionCard>
          <SectionCard className="order-5" title="Actividad reciente" description="Últimos pedidos, ventas y cambios de estado."><RecentActivity data={data} /></SectionCard>
        </div>
      </div>
    </> : null}
  </div>;
}

const activityTones = {
  brand: "bg-brand-soft text-brand",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
};

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  if (!orders.length) return <EmptyState icon={<Receipt />} title="Todavía no hay pedidos para mostrar" />;
  return <>
    <div className="hidden sm:block"><Table><caption className="sr-only">Últimos pedidos: número, cliente, estado, total y fecha</caption><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Estado</TableHead><TableHead numeric>Total</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader><TableBody>{orders.map(order => <TableRow key={order.id}><TableCell className="font-semibold"><Link className="text-brand hover:underline" href={"/admin/pedidos?buscar=" + order.order_number}>#{order.order_number}</Link></TableCell><TableCell>{order.customer_name || "Sin nombre registrado"}</TableCell><TableCell><Badge status={order.status} className="whitespace-normal" /></TableCell><TableCell numeric>Bs {formatMoney(Number(order.total))}</TableCell><TableCell className="text-xs text-text-secondary"><time dateTime={order.created_at}>{formatDateTime(order.created_at)}</time></TableCell></TableRow>)}</TableBody></Table></div>
    <ul className="space-y-3 sm:hidden">{orders.map(order => <li className="min-w-0 rounded-xl border border-border-decorative p-4" key={order.id}><div className="flex flex-wrap items-center justify-between gap-2"><Link href={"/admin/pedidos?buscar=" + order.order_number} className="text-sm font-semibold text-brand">#{order.order_number}</Link><Badge status={order.status} /></div><p className="mt-2 break-words text-sm">{order.customer_name || "Sin nombre registrado"}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums">Bs {formatMoney(Number(order.total))}</p><time dateTime={order.created_at} className="mt-1 block text-xs text-text-secondary">{formatDateTime(order.created_at)}</time></li>)}</ul>
  </>;
}

function RecentActivity({ data }: { data: Dashboard }) {
  if (!data.activity.length && !data.recent_statuses.length && !data.recent_orders?.length) return <EmptyState icon={<Clock3 />} title="Sin actividad para mostrar" />;
  return <ul className="mt-4 space-y-4">
    {data.recent_orders?.slice(0, 2).map(order => <Activity key={`new-${order.id}`} icon={<ShoppingBag size={16} />} tone="brand" title={`Nuevo pedido #${order.order_number}`} detail={order.customer_name || "Sin nombre registrado"} date={order.created_at} />)}
    {data.activity.slice(0, 4).map(event => <Activity key={event.event_id} icon={event.kind === "refund" ? <Undo2 size={16} /> : <Receipt size={16} />} tone={event.kind === "refund" ? "danger" : "success"} title={`${event.kind === "refund" ? "Reintegro registrado" : "Venta confirmada"} #${event.order_number}`} detail={`Bs ${formatMoney(Number(event.amount))}`} date={event.occurred_at} />)}
    {data.recent_statuses.slice(0, 2).map(order => <Activity key={`status-${order.id}`} icon={<Flower2 size={16} />} tone="brand" title={`Pedido #${order.order_number} · ${order.status === "listo" ? "Listo" : "Entregado"}`} date={order.updated_at} />)}
  </ul>;
}
function Activity({ icon, tone, title, detail, date }: { icon: ReactNode; tone: keyof typeof activityTones; title: string; detail?: string; date: string }) {
  return <li className="flex min-w-0 gap-3"><span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-xl ${activityTones[tone]}`}>{icon}</span><div className="min-w-0"><Link href="/admin/pedidos" className="break-words text-xs font-semibold text-text hover:text-brand">{title}</Link>{detail && <p className="mt-0.5 break-words text-xs text-text-secondary">{detail}</p>}<time dateTime={date} className="mt-1 block text-xs text-text-secondary">{formatDateTime(date)}</time></div></li>;
}
