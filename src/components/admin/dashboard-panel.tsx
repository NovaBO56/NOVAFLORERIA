"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, BarChart3, Boxes, CircleAlert, Clock3, Flower2, Package, Receipt, RotateCcw, ShoppingBag, ShoppingCart, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const panel = "min-w-0 rounded-[24px] border border-[#eee7ee] bg-white p-5 shadow-[0_3px_20px_-12px_rgba(78,41,68,0.15)] sm:p-6";
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

  return <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]" aria-busy={loading}>
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-semibold tracking-tight text-[#25212b]">Dashboard</h1><p className="mt-1.5 text-sm text-text-secondary sm:text-base">Resumen general de tu florería</p></div>
      <Button variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RotateCcw aria-hidden size={15} />Actualizar</Button>
    </header>
    <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-[#eee7ee] bg-white/80 p-3">
      <div className="flex shrink-0 gap-1 rounded-xl bg-[#f7f3f8] p-1">{[1, 7, 30].map(days => {
        const selection = range(days), selected = dates.from === selection.from && dates.to === selection.to;
        return <button key={days} aria-pressed={selected} className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${selected ? "bg-white text-[#ae316b] shadow-sm" : "text-text-secondary hover:bg-white/60"}`} onClick={() => setDates(selection)}>{days === 1 ? "Hoy" : `${days} días`}</button>;
      })}</div>
      <div className="flex min-w-0 flex-wrap gap-3 text-xs text-text-secondary">
        <label className="flex min-w-0 items-center gap-2">Desde<input aria-label="Desde" type="date" value={dates.from} max={dates.to} className="min-h-10 min-w-0 max-w-full rounded-xl border border-[#e9e2e9] bg-white px-2 text-text focus-visible:outline-2 focus-visible:outline-brand" onChange={event => { if (event.target.value) setDates(current => ({ ...current, from: event.target.value })); }} /></label>
        <label className="flex min-w-0 items-center gap-2">Hasta<input aria-label="Hasta" type="date" value={dates.to} min={dates.from} className="min-h-10 min-w-0 max-w-full rounded-xl border border-[#e9e2e9] bg-white px-2 text-text focus-visible:outline-2 focus-visible:outline-brand" onChange={event => { if (event.target.value) setDates(current => ({ ...current, to: event.target.value })); }} /></label>
      </div>
      <p className="text-[11px] text-text-secondary sm:ml-auto">America/La_Paz</p>
    </div>
    {error ? <div role="alert" className={`${panel} text-danger`}><CircleAlert aria-hidden className="mb-2" />{error}<Button variant="outline" className="mt-3" onClick={() => setRefresh(value => value + 1)}>Reintentar</Button></div> : loading ? <div role="status" className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6"><span className="sr-only">Cargando dashboard…</span>{[0, 1, 2, 3, 4, 5].map(index => <div key={index} className="h-40 animate-pulse rounded-[22px] bg-white/70 motion-reduce:animate-none" />)}</div> : data ? <>
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <Metric label="Ventas netas" value={`Bs ${formatMoney(data.financial.net_sales)}`} Icon={BarChart3} tone="pink" main hint="Brutas menos reintegros" />
        <Metric label="Ventas brutas" value={`Bs ${formatMoney(data.financial.gross_sales)}`} Icon={ShoppingCart} tone="green" hint="Ventas originales confirmadas" />
        <Metric label="Devoluciones" value={`Bs ${formatMoney(data.financial.refunds)}`} Icon={Undo2} tone="coral" hint="Reintegros monetarios" />
        <Metric label="Pedidos de hoy" value={String(data.today_orders)} Icon={Receipt} tone="violet" href="/admin/pedidos" hint="Todos los pedidos de hoy" />
        <Metric label="Pagos pendientes" value={String(data.pending_payments)} Icon={Clock3} tone="amber" href="/admin/pedidos?pago=pendiente" hint="Por verificar" />
        <Metric label="Stock crítico" value={String(data.inventory.length)} Icon={Package} tone="mint" href="/admin/inventario" hint="Insumos que requieren atención" />
      </div>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="contents xl:block xl:min-w-0 xl:space-y-5">
          <section className={`${panel} order-1`} aria-label="Ventas y devoluciones"><SectionHeading title="Ventas y devoluciones" href="/admin/reportes" action="Ver reportes" /><p className="mt-1.5 text-xs text-text-secondary">{dates.from} al {dates.to}</p><SalesChart key={`${dates.from}:${dates.to}`} series={data.financial.series} /></section>
          <section className={`${panel} order-3`} aria-label="Pedidos recientes"><SectionHeading title="Pedidos recientes" href="/admin/pedidos" /><p className="mt-1.5 text-xs text-text-secondary">Los últimos pedidos, independientemente del rango de ventas.</p><RecentOrders orders={data.recent_orders ?? []} /></section>
          <section className={`${panel} order-6`}><SectionHeading title="Productos más vendidos" /><p className="mt-1.5 text-xs text-text-secondary">Unidades originales vendidas en el período.</p>
            {!data.bestsellers.length ? <Empty message="Todavía no hay ventas en este período." /> : <ol className="mt-4 space-y-3">{data.bestsellers.map((item, index) => <li key={item.name + index} className="flex min-w-0 items-center gap-3 rounded-xl bg-[#faf8fc] p-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eee5f6] text-sm font-semibold text-[#705194]">{index + 1}</span><span className="min-w-0 flex-1 break-words text-sm">{item.name}</span><span className="shrink-0 text-sm font-semibold tabular-nums">{item.quantity} u.</span></li>)}</ol>}
          </section>
        </div>
        <div className="contents xl:block xl:min-w-0 xl:space-y-5">
          <section className={`${panel} order-2`} aria-label="Estado de pedidos"><SectionHeading title="Estado de pedidos" /><OrderStatusDonut statuses={data.statuses} /></section>
          <section className={`${panel} order-4`} aria-label="Stock crítico"><SectionHeading title="Stock crítico" href="/admin/inventario" />
            {!data.inventory.length ? <Empty message="Sin alertas de stock." /> : <ul className="mt-4 space-y-3">{data.inventory.slice(0, 6).map(item => <li key={item.id} className="flex min-w-0 items-center gap-3 border-b border-[#f2ecf1] pb-3 last:border-0 last:pb-0"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff0f4] text-[#b74373]"><Boxes size={20} aria-hidden /></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-text-secondary">{item.current_stock} {item.unit}</p></div><span className="shrink-0 rounded-full bg-[#fff0f1] px-2 py-1 text-[10px] font-medium text-[#a43647]">{Number(item.current_stock) <= 0 ? "Agotado" : "Stock bajo"}</span></li>)}</ul>}
            {data.inventory.length > 6 && <p className="mt-3 text-xs text-text-secondary">{data.inventory.length} insumos requieren atención. Consulta la lista completa en inventario.</p>}
          </section>
          <section className={`${panel} order-5`} aria-label="Actividad reciente"><SectionHeading title="Actividad reciente" href="/admin/pedidos" /><RecentActivity data={data} /></section>
        </div>
      </div>
    </> : null}
  </div>;
}

const tones = {
  pink: { card: "bg-[#fcebf3]", icon: "bg-[#f9d4e5] text-[#b62b69]" },
  green: { card: "bg-[#edf8f0]", icon: "bg-[#d4efdb] text-[#2c7650]" },
  coral: { card: "bg-[#fff0ef]", icon: "bg-[#fbd9d7] text-[#b54642]" },
  violet: { card: "bg-[#f3edfc]", icon: "bg-[#e6d9f6] text-[#72529b]" },
  amber: { card: "bg-[#fff8e9]", icon: "bg-[#faeac2] text-[#946610]" },
  mint: { card: "bg-[#edf7f4]", icon: "bg-[#d6eee4] text-[#2f7965]" },
};
function Metric({ label, value, hint, main, href, Icon, tone }: { label: string; value: string; hint: string; main?: boolean; href?: string; Icon: typeof Receipt; tone: keyof typeof tones }) {
  const content = <><span aria-hidden className={`mb-3 grid size-10 place-items-center rounded-2xl ${tones[tone].icon}`}><Icon size={21} strokeWidth={1.8} /></span><p className="text-xs font-medium leading-5 text-[#433741]">{label}</p><p className="mt-1 min-w-0 break-words text-[22px] font-semibold leading-tight tracking-tight tabular-nums text-[#25212b] [overflow-wrap:anywhere] sm:text-[26px]">{value}</p><p className="mt-2 text-[10px] leading-4 text-[#746671]">{hint}</p></>;
  // Keep unusually large amounts together on narrow screens, rather than
  // splitting digit groups across two small cards. Normal KPIs stay two-up.
  const className = `min-w-0 rounded-[22px] p-4 sm:p-5 ${value.length > 16 ? "col-span-2 sm:col-span-1" : ""} ${tones[tone].card} ${main ? "ring-1 ring-[#e9b8d1] shadow-[0_5px_22px_-12px_rgba(162,46,101,0.3)]" : ""}`;
  return href ? <Link href={href} className={`${className} transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-brand`}>{content}</Link> : <section className={className}>{content}</section>;
}
function SectionHeading({ title, href, action = "Ver todos" }: { title: string; href?: string; action?: string }) {
  return <div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold tracking-tight text-[#302832]">{title}</h2>{href && <Link href={href} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-[#e9e2e9] bg-white px-3 text-[11px] font-medium text-text-secondary hover:bg-[#faf7fb] focus-visible:outline-2 focus-visible:outline-brand">{action}<ArrowUpRight size={12} aria-hidden /></Link>}</div>;
}
function Empty({ message }: { message: string }) { return <p className="py-8 text-center text-sm leading-6 text-text-secondary">{message}</p>; }

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  if (!orders.length) return <Empty message="Todavía no hay pedidos para mostrar." />;
  return <>
    <div className="mt-4 hidden sm:block"><table className="w-full table-fixed text-left text-xs"><caption className="sr-only">Últimos pedidos: número, cliente, estado, total y fecha</caption><thead className="bg-[#faf7fb] text-[10px] text-text-secondary"><tr><th className="w-[13%] rounded-l-lg p-2">Pedido</th><th className="w-[23%] p-2">Cliente</th><th className="w-[22%] p-2">Estado</th><th className="w-[19%] p-2">Total</th><th className="w-[23%] rounded-r-lg p-2">Fecha</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} className="border-b border-[#f2ecf1] last:border-0"><td className="p-2.5 font-semibold">#{order.order_number}</td><td className="break-words p-2.5">{order.customer_name || "Sin nombre registrado"}</td><td className="p-2.5"><Badge status={order.status} className="max-w-full whitespace-normal text-[10px] leading-4" /></td><td className="break-words p-2.5 font-medium tabular-nums">Bs {formatMoney(Number(order.total))}</td><td className="p-2.5 text-[10px] leading-4 text-text-secondary"><time dateTime={order.created_at}>{formatDateTime(order.created_at)}</time></td></tr>)}</tbody></table></div>
    <ul className="mt-4 space-y-3 sm:hidden">{orders.map(order => <li className="min-w-0 rounded-2xl border border-[#f0e8ef] p-3" key={order.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">#{order.order_number}</p><Badge status={order.status} className="text-[10px]" /></div><p className="mt-2 break-words text-xs">{order.customer_name || "Sin nombre registrado"}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums">Bs {formatMoney(Number(order.total))}</p><time dateTime={order.created_at} className="mt-1 block text-[10px] text-text-secondary">{formatDateTime(order.created_at)}</time></li>)}</ul>
  </>;
}
function RecentActivity({ data }: { data: Dashboard }) {
  if (!data.activity.length && !data.recent_statuses.length && !data.recent_orders?.length) return <Empty message="Sin actividad para mostrar." />;
  return <ul className="mt-4 space-y-4">
    {data.recent_orders?.slice(0, 2).map(order => <Activity key={`new-${order.id}`} icon={<ShoppingBag size={16} />} tone="pink" title={`Nuevo pedido #${order.order_number}`} detail={order.customer_name || "Sin nombre registrado"} date={order.created_at} />)}
    {data.activity.slice(0, 4).map(event => <Activity key={event.event_id} icon={event.kind === "refund" ? <Undo2 size={16} /> : <Receipt size={16} />} tone={event.kind === "refund" ? "coral" : "green"} title={`${event.kind === "refund" ? "Reintegro registrado" : "Venta confirmada"} #${event.order_number}`} detail={`Bs ${formatMoney(Number(event.amount))}`} date={event.occurred_at} />)}
    {data.recent_statuses.slice(0, 2).map(order => <Activity key={`status-${order.id}`} icon={<Flower2 size={16} />} tone="violet" title={`Pedido #${order.order_number} · ${order.status === "listo" ? "Listo" : "Entregado"}`} date={order.updated_at} />)}
  </ul>;
}
function Activity({ icon, tone, title, detail, date }: { icon: ReactNode; tone: keyof typeof tones; title: string; detail?: string; date: string }) {
  return <li className="flex min-w-0 gap-3"><span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-xl ${tones[tone].icon}`}>{icon}</span><div className="min-w-0"><Link href="/admin/pedidos" className="break-words text-xs font-semibold text-[#383039] hover:text-brand">{title}</Link>{detail && <p className="mt-0.5 break-words text-xs text-text-secondary">{detail}</p>}<time dateTime={date} className="mt-1 block text-[10px] text-text-secondary">{formatDateTime(date)}</time></div></li>;
}
