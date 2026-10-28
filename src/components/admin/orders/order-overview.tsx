"use client";
import { useEffect, useState } from "react";
import { Clock3, Flower2, ShoppingBag, Wallet } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatMoney } from "@/lib/format";
type Summary = { today_orders: number; pending_payments: number; statuses: Record<string, number>; financial: { net_sales: number } };
export function OrderOverview({ refreshToken }: { refreshToken: unknown }) {
 const [result, setResult] = useState<{ token: unknown; data: Summary | null; error: boolean } | null>(null);
 const current = result && Object.is(result.token, refreshToken) ? result : null;
 const data = current?.data ?? null;
 const error = current?.error ?? false;
 useEffect(() => { const controller = new AbortController();
  void (async () => { try { const response = await fetch("/api/admin/dashboard", {signal:controller.signal}); const body = await response.json(); if(!response.ok || !body.success) throw Error(); if(!controller.signal.aborted) setResult({token:refreshToken,data:body.dashboard,error:false}); } catch { if(!controller.signal.aborted) setResult({token:refreshToken,data:null,error:true}); } })();
  return () => controller.abort();
 }, [refreshToken]);
 const metrics = [
  { label:"Pedidos de hoy", value:data?.today_orders, note:"Registrados hoy · hora Bolivia", Icon:ShoppingBag, tone:"neutral" },
  { label:"Por verificar pago", value:data?.pending_payments, note:"Pagos pendientes de revisión", Icon:Clock3, tone:"warning" },
  { label:"En preparación", value:data?.statuses.en_preparacion, note:"Pedidos actualmente en taller", Icon:Flower2, tone:"brand" },
  { label:"Ventas netas del día", value:data ? "Bs. " + formatMoney(data.financial.net_sales) : undefined, note:"Ventas menos reintegros de hoy", Icon:Wallet, tone:"success" },
 ] as const;
 return <div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de pedidos"><span className="sr-only" role="status">{error ? "No se pudo cargar el resumen." : !data ? "Cargando resumen…" : "Resumen actualizado"}</span>{metrics.map(({label,value,note,Icon,tone}) => <StatCard key={label} label={label} value={String(value ?? "—")} description={note} icon={<Icon aria-hidden />} tone={tone} />)}</div>{error && <p role="alert" className="mt-2 text-xs text-danger">El resumen no está disponible. El listado de pedidos puede seguir utilizándose.</p>}</div>;
}
