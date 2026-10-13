import type { createClient } from "@/lib/supabase/server";
import { readAllPages } from "@/lib/db/read-all-pages";
import { cents } from "@/lib/money";
import { businessDate } from "@/lib/business-date";

export type SalesEvent = {
  kind: "sale" | "refund"; event_id: string; order_id: string; order_number: number;
  order_type: string; original_total: number; amount: number; occurred_at: string;
  order_status: string; customer_name: string | null;
  payment_method: string | null; actor_id: string | null; actor_name: string | null;
  return_type: string | null; reason: string | null;
  financial_effect?: number;
};

export function salesTotals(events: SalesEvent[], from: string, to: string) {
  let gross = 0, refunds = 0;
  const methods: Record<string, number> = {};
  const days = new Map<string, { date: string; gross_sales: number; refunds: number; net_sales: number }>();
  const dailyRange = (new Date(to).getTime() - new Date(from).getTime()) <= 365 * 86400000;
  for (let date = new Date(`${from}T12:00:00Z`); dailyRange && date <= new Date(`${to}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    days.set(key, { date: key, gross_sales: 0, refunds: 0, net_sales: 0 });
  }
  for (const event of events) {
    const amount = cents(event.amount);
    const date = businessDate(new Date(event.occurred_at));
    if (!days.has(date)) days.set(date, { date, gross_sales: 0, refunds: 0, net_sales: 0 });
    const day = days.get(date);
    if (event.kind === "sale") {
      gross += amount;
      const method = event.payment_method ?? "sin_pago_confirmado";
      methods[method] = (methods[method] ?? 0) + amount;
      if (day) day.gross_sales += amount;
    } else { refunds += amount; if (day) day.refunds += amount; }
  }
  const sales = events.filter(event => event.kind === "sale");
  return {
    from, to, gross_sales: gross / 100, refunds: refunds / 100, net_sales: (gross - refunds) / 100,
    // Compatibility field remains gross, explicitly labelled in the UI/PDF.
    total_sales: gross / 100,
    count_online: sales.filter(event => event.order_type === "online").length,
    count_fisica: sales.filter(event => event.order_type === "fisica").length,
    by_payment_method: Object.fromEntries(Object.entries(methods).map(([method, amount]) => [method, amount / 100])),
    series: [...days.values()].sort((a,b) => a.date.localeCompare(b.date)).map(day => ({ ...day, gross_sales: day.gross_sales / 100, refunds: day.refunds / 100, net_sales: (day.gross_sales - day.refunds) / 100 })),
  };
}

export async function readSalesLedger(client: Awaited<ReturnType<typeof createClient>>, from: string, to: string) {
  const events = await readAllPages<SalesEvent>((start, end) => client.from("sales_ledger")
    .select("*", { count: "exact" }).gte("occurred_at", `${from}T00:00:00-04:00`)
    .lte("occurred_at", `${to}T23:59:59.999999-04:00`).order("occurred_at").order("event_id").range(start, end));
  return { events: events.map(event => ({ ...event, financial_effect: (event.kind === "sale" ? cents(event.amount) : -cents(event.amount)) / 100 })), summary: salesTotals(events, from, to) };
}
