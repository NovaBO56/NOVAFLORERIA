"use client";
import { useEffect, useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auditPresentation } from "@/lib/audit-presentation";

export function AuditEntries() {
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [filters,setFilters] = useState({from:"",to:"",table:"",action:"",user_id:""});
  const [users,setUsers] = useState<{id:string;full_name:string}[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      fetch(`/api/admin/audit-log?limit=50&offset=${offset}&${new URLSearchParams(Object.entries(filters).filter(([,value]) => value))}`, { signal: controller.signal }).then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "No se pudo cargar la auditoría.");
        if (!controller.signal.aborted) { setEntries(result.entries); setUsers(current => [...new Map([...current,...(result.users || [])].map(user => [user.id,user])).values()]); }
      }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [offset,retry,filters]);
  return <>
    <div className="admin-filter-bar grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {(["from","to"] as const).map(key => <Field key={key} label={key === "from" ? "Desde" : "Hasta"}><Input type="date" value={filters[key]} onChange={event => {setOffset(0);setFilters(current=>({...current,[key]:event.target.value}));}} /></Field>)}
      <label className="text-sm font-medium">Módulo<select className="mt-2 block h-11 w-full min-w-0 rounded-xl border border-border-field bg-surface px-3 text-sm" value={filters.table} onChange={event=>{setOffset(0);setFilters(current=>({...current,table:event.target.value}));}}><option value="">Todos</option>{Object.entries({orders:"Pedidos",payments:"Pagos",inventory_entries:"Entradas",inventory_adjustments:"Ajustes",inventory_waste:"Mermas",inventory_movements:"Inventario",cash_sessions:"Caja",cash_movements:"Movimientos de caja",system_settings:"Configuración",products:"Productos",promotions:"Promociones",profiles:"Usuarios",whatsapp_config:"WhatsApp",payment_qr_config:"QR"}).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">Acción<select className="mt-2 block h-11 w-full min-w-0 rounded-xl border border-border-field bg-surface px-3 text-sm" value={filters.action} onChange={event=>{setOffset(0);setFilters(current=>({...current,action:event.target.value}));}}><option value="">Todas</option>{Object.entries({INSERT:"Registro",UPDATE:"Actualización",DELETE:"Eliminación",pago_confirmado:"Pago confirmado",pedido_cancelado:"Pedido cancelado"}).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">Usuario<select className="mt-2 block h-11 w-full min-w-0 rounded-xl border border-border-field bg-surface px-3 text-sm" value={filters.user_id} onChange={event=>{setOffset(0);setFilters(current=>({...current,user_id:event.target.value}));}}><option value="">Todos</option>{users.map(user=><option key={user.id} value={user.id}>{user.full_name || "Usuario sin nombre"}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-text-secondary">Registro administrativo compartido</p><Badge variant="outline">Página {offset / 50 + 1}</Badge></div>
    {error ? <Card><p role="alert" className="text-danger">{error}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Reintentar</Button></Card> : loading ? <Card role="status">Cargando registros…</Card> : entries.length === 0 ? <Card><EmptyState title="No hay registros en esta página" description="Prueba con otro rango de fechas o cambia los filtros." /></Card> : entries.map((entry,index) => <details key={String(entry.id || `${offset}-${index}`)} className="min-w-0 rounded-xl border border-border-decorative bg-surface p-5 shadow-card">
      <summary className="cursor-pointer break-words text-sm font-semibold leading-6 focus-visible:outline-2 focus-visible:outline-brand">{auditPresentation(entry).title} · {new Date(String(entry.created_at)).toLocaleString("es-BO",{timeZone:"America/La_Paz"})}<span className="mt-2 block text-xs font-normal text-text-secondary">Usuario: {auditPresentation(entry).user}</span>{auditPresentation(entry).facts.map((fact,index)=><span key={index} className="mt-1 block text-sm font-normal text-text-secondary">{fact}</span>)}<span className="mt-3 block text-xs font-medium text-brand">Ver detalles técnicos</span></summary>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-brand-soft/40 p-3 text-xs">{JSON.stringify(entry,null,2)}</pre>
    </details>)}
    <nav aria-label="Páginas de auditoría" className="admin-action-bar justify-end"><Button variant="outline" disabled={loading || offset === 0} onClick={() => setOffset(value => Math.max(0,value-50))}>Anterior</Button><Button variant="outline" disabled={loading || Boolean(error) || entries.length < 50} onClick={() => setOffset(value => value+50)}>Siguiente</Button></nav>
  </>;
}
