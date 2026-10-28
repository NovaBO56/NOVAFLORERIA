"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { salesTotals } from "@/lib/reports/sales-ledger";

type Series = ReturnType<typeof salesTotals>["series"];
const moneyColors = { net_sales: "#7c3aed", gross_sales: "#059669", refunds: "#dc2626" };
const moneyLabels = { net_sales: "Ventas netas", gross_sales: "Ventas brutas", refunds: "Devoluciones" };
const dateLabel = (date: string) => new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const compactMoney = (amount: number) => new Intl.NumberFormat("es-BO", { notation: "compact", maximumFractionDigits: 1 }).format(amount);

/** Presentation of the server's existing daily amounts; no financial recalculation. */
export function SalesChart({ series }: { series: Series }) {
  const [selected, setSelected] = useState<number | null>(null);
  const tooltipId = useId();
  if (!series.length) return <p className="py-12 text-center text-sm text-text-secondary">Sin datos de ventas en este período.</p>;
  const current = Math.min(selected ?? series.length - 1, series.length - 1);
  const day = series[current];
  const minimum = Math.min(0, ...series.map(item => item.net_sales));
  const maximum = Math.max(1, ...series.flatMap(item => [item.gross_sales, item.refunds]));
  const y = (value: number) => 184 - (value - minimum) / (maximum - minimum) * 160;
  const x = (index: number) => 20 + (index + 0.5) / series.length * 660;
  const zero = y(0);
  const barWidth = Math.min(26, 660 / series.length * 0.31);
  const allZero = series.every(item => item.gross_sales === 0 && item.refunds === 0 && item.net_sales === 0);
  return <div className="mt-5 min-w-0">
    <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
      {Object.entries(moneyLabels).map(([key, label]) => <span key={key} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: moneyColors[key as keyof typeof moneyColors] }} />{label}</span>)}
    </div>
    <div id={tooltipId} role="status" aria-live="polite" aria-atomic="true" className="mb-4 min-w-0 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
      <p className="mb-2 text-xs font-semibold text-text">{dateLabel(day.date)}</p>
      <dl className="grid min-w-0 gap-2 sm:grid-cols-3">{Object.entries(moneyLabels).map(([key, label]) => <div className="min-w-0" key={key}><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-0.5 break-words text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">Bs {formatMoney(day[key as keyof typeof moneyLabels])}</dd></div>)}</dl>
    </div>
    {allZero && <p className="mb-3 text-sm text-text-secondary">Sin ventas ni reintegros en este período.</p>}
    <div className="flex min-w-0 gap-2">
      <div aria-hidden="true" className="flex h-52 w-14 shrink-0 flex-col justify-between py-5 text-right text-xs text-text-secondary">{[maximum, minimum + (maximum - minimum) / 2, minimum].map((value, index) => <span key={index}>Bs {compactMoney(value)}</span>)}</div>
      <div className="min-w-0 flex-1">
        <svg className="h-52 w-full overflow-visible" viewBox="0 0 700 208" preserveAspectRatio="none" role="group" aria-label="Ventas diarias. Selecciona una fecha para consultar los importes; usa las flechas con el teclado.">
          {[minimum, minimum + (maximum - minimum) / 2, maximum].map((value, index) => <line key={index} x1="0" x2="700" y1={y(value)} y2={y(value)} stroke="#e2e8f0" strokeDasharray={value === 0 ? undefined : "4 5"} />)}
          {series.map((item, index) => <g key={item.date}>
            <rect x={x(index) - barWidth - 1} y={y(item.gross_sales)} width={barWidth} height={Math.max(0, zero - y(item.gross_sales))} rx="4" fill="#6ee7b7" />
            <rect x={x(index) + 1} y={Math.min(y(item.net_sales), zero)} width={barWidth} height={Math.abs(zero - y(item.net_sales))} rx="4" fill="#a78bfa" />
          </g>)}
          <polyline points={series.map((item, index) => `${x(index)},${y(item.refunds)}`).join(" ")} fill="none" stroke={moneyColors.refunds} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <line x1={x(current)} x2={x(current)} y1="10" y2="190" stroke="#7c3aed" strokeDasharray="3 4" />
          {series.map((item, index) => <g key={item.date} role="button" tabIndex={index === current ? 0 : -1} aria-describedby={tooltipId} aria-label={`${dateLabel(item.date)}: netas Bs ${formatMoney(item.net_sales)}, brutas Bs ${formatMoney(item.gross_sales)}, devoluciones Bs ${formatMoney(item.refunds)}`} onPointerEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setSelected(index)} onKeyDown={event => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault(); const next = Math.max(0, Math.min(series.length - 1, index + (event.key === "ArrowRight" ? 1 : -1))); setSelected(next);
              const controls = event.currentTarget.parentElement?.querySelectorAll<SVGGElement>('[role="button"]'); controls?.[next]?.focus();
            } else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(index); }
          }}>
            <rect x={20 + index / series.length * 660} y="0" width={660 / series.length} height="200" fill="transparent" className="cursor-pointer outline-none focus:stroke-brand focus:stroke-2" />
          </g>)}
        </svg>
        <div className="flex justify-between gap-2 text-xs text-text-secondary"><span>{dateLabel(series[0].date)}</span>{series.length > 2 && <span>{dateLabel(series[Math.floor((series.length - 1) / 2)].date)}</span>}{series.length > 1 && <span>{dateLabel(series.at(-1)!.date)}</span>}</div>
      </div>
    </div>
    <p className="mt-4 text-xs leading-5 text-text-secondary">Toca o señala el gráfico para ver los importes. Los reintegros se muestran en su fecha de registro.</p>
    <details className="mt-2 text-sm"><summary className="min-h-10 cursor-pointer py-2 font-medium text-brand">Ver importes por día</summary><div className="max-h-64 overflow-auto rounded-xl border border-[#e2e8f0]"><table className="w-full text-left text-xs"><caption className="sr-only">Importes diarios en bolivianos</caption><thead className="bg-[#f8fafc]"><tr>{["Fecha", "Brutas", "Devoluciones", "Netas"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{series.map(item => <tr className="border-t border-[#e2e8f0]" key={item.date}><td className="whitespace-nowrap p-3">{dateLabel(item.date)}</td>{[item.gross_sales, item.refunds, item.net_sales].map((amount, index) => <td className="p-3 tabular-nums" key={index}>{formatMoney(amount)}</td>)}</tr>)}</tbody></table></div></details>
  </div>;
}

const orderStates = [
  { key: "confirmado", label: "Confirmados", color: "#059669" },
  { key: "pendiente_pago", label: "Pendientes de pago", color: "#d97706" },
  { key: "en_preparacion", label: "En preparación", color: "#7c3aed" },
  { key: "listo", label: "Listos", color: "#0d9488" },
  { key: "finalizado", label: "Entregados", color: "#64748b" },
  { key: "cancelado", label: "Cancelados", color: "#94a3b8" },
  { key: "rechazado", label: "Pago rechazado", color: "#dc2626" },
] as const;

export function OrderStatusDonut({ statuses }: { statuses: Record<string, number> }) {
  const total = orderStates.reduce((sum, state) => sum + (statuses[state.key] ?? 0), 0);
  let cursor = 0;
  const stops = orderStates.flatMap(state => {
    const count = statuses[state.key] ?? 0;
    if (!count || !total) return [];
    const from = cursor; cursor += count / total * 100;
    return [`${state.color} ${from}% ${cursor}%`];
  });
  return <>
    <div className="mt-5 flex min-w-0 flex-wrap items-center justify-center gap-5">
      <div className="relative grid size-40 shrink-0 place-items-center rounded-full" style={{ background: total ? `conic-gradient(${stops.join(",")})` : "#e2e8f0" }}>
        <div className="grid size-[116px] content-center rounded-full bg-white text-center"><span className="break-words px-2 text-3xl font-semibold tabular-nums [overflow-wrap:anywhere]">{total}</span><span className="mt-1 text-xs text-text-secondary">Total pedidos</span></div>
      </div>
      <ul className="min-w-40 flex-1 space-y-2.5 text-xs">{orderStates.map(state => {
        const count = statuses[state.key] ?? 0;
        const percentage = total ? new Intl.NumberFormat("es-BO", { maximumFractionDigits: 1 }).format(count / total * 100) : "0";
        return <li key={state.key}><Link href={`/admin/pedidos?estado=${state.key}`} className="flex min-h-8 items-center justify-between gap-3 rounded-lg hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-brand"><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: state.color }} />{state.label}</span><span className="shrink-0 font-semibold tabular-nums">{count} <span className="font-normal text-text-secondary">({percentage}%)</span></span></Link></li>;
      })}</ul>
    </div>
    {!total && <p className="mt-4 text-sm text-text-secondary">Todavía no hay pedidos para mostrar.</p>}
    <p className="mt-4 text-xs leading-5 text-text-secondary">Pedidos actuales, sin eliminados. Este conjunto es independiente del rango de ventas.</p>
  </>;
}
