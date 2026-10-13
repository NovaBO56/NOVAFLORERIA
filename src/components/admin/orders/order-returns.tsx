"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatDateTime, formatMoney } from "@/lib/format";

type Return = {id:string;type:"devolucion"|"reintegro"|"retorno_fisico";amount:number;reason:string;created_at:string};
export function OrderReturns({orderId,total,physical,cancelled=false,canCreate,onChanged,onBusyChange}:{orderId:string;total:number;physical:boolean;cancelled?:boolean;canCreate:boolean;onChanged:()=>void;onBusyChange:(busy:boolean)=>void}) {
  const [entries,setEntries]=useState<Return[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [editing,setEditing]=useState(false);
  const [type,setType]=useState<Return["type"]>("reintegro");
  const [amount,setAmount]=useState("");
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const lock=useRef(false);
  const attempt=useRef<{fingerprint:string;key:string}|null>(null);
  const load = useCallback(async () => {
    const response=await fetch(`/api/admin/orders/${orderId}/returns`); const data=await response.json();
    if(!response.ok) throw Error(data.message || "No se pudieron cargar las devoluciones.");
    setEntries(data.returns);
  }, [orderId]);
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{void load().catch(cause=>{if(active)setError(cause.message);}).finally(()=>{if(active)setLoading(false);});},0);return()=>{active=false;clearTimeout(timer);};},[load]);
  const remaining=Math.max(0,Math.round((Number(total)-entries.reduce((sum,item)=>sum+Number(item.amount),0))*100)/100);
  const returned=cancelled || entries.some(item=>item.type!=="reintegro");
  return <section className="flex min-w-0 flex-col gap-3 border-t border-border-decorative pt-4" aria-label="Devoluciones y reintegros">
    <h3 className="font-semibold">Devoluciones y reintegros</h3>
    {cancelled && <p className="text-sm text-text-secondary">La cancelación restituyó el inventario, pero no devolvió el dinero. Registra aquí únicamente el reintegro realizado y verificado.</p>}
    {loading ? <p role="status">Cargando historial…</p> : entries.length===0 ? <p className="text-sm text-text-secondary">Sin devoluciones registradas.</p> : <ul className="space-y-2">{entries.map(item=><li key={item.id} className="rounded-lg bg-brand-soft/40 p-3 text-sm"><strong>{item.type==="devolucion"?"Devolución":item.type==="retorno_fisico"?"Retorno físico":"Reintegro"} · Bs {formatMoney(item.amount)}</strong><p className="break-words">{item.reason}</p><time dateTime={item.created_at} className="text-text-secondary">{formatDateTime(item.created_at)}</time></li>)}</ul>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {error && !editing && <Button variant="outline" disabled={loading} onClick={()=>{setLoading(true);setError("");void load().catch(cause=>setError(cause.message)).finally(()=>setLoading(false));}}>Reintentar historial</Button>}
    {success && <p role="status" className="text-sm text-leaf">{success}</p>}
    {canCreate && !loading && !error && (remaining>0 || !returned) && !editing && <Button variant="outline" onClick={()=>{setType(remaining>0?"reintegro":"retorno_fisico");setAmount(String(remaining));setEditing(true);setSuccess("");}}>Registrar devolución o reintegro</Button>}
    {editing && <form className="space-y-3" onSubmit={event=>{event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);onBusyChange(true);setError("");void(async()=>{
      try {
        const fingerprint=JSON.stringify({type,amount:type==="retorno_fisico"?0:Number(amount),reason:reason.trim()});
        const storageKey=`nova-return-attempt:${orderId}`;
        try { attempt.current=JSON.parse(sessionStorage.getItem(storageKey)||"null") || attempt.current; } catch { /* Storage is optional. */ }
        if(attempt.current?.fingerprint!==fingerprint)attempt.current={fingerprint,key:crypto.randomUUID()};
        try {sessionStorage.setItem(storageKey,JSON.stringify(attempt.current));}catch{/* In-memory retries remain safe. */}
        const response=await fetch(`/api/admin/orders/${orderId}/returns`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...JSON.parse(fingerprint),idempotency_key:attempt.current.key})});const data=await response.json();
        if(!response.ok)throw Error(data.message || "No se pudo registrar. Revisa el monto y la caja.");
        try{sessionStorage.removeItem(storageKey);}catch{/* Optional storage. */}attempt.current=null;
        setEditing(false);setReason("");setSuccess("Operación registrada.");await load();onChanged();
      }catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar.");}finally{lock.current=false;setBusy(false);onBusyChange(false);}
    })();}}>
      <fieldset disabled={busy} className="space-y-3">
        <Field label="Tipo de operación"><select value={type} onChange={event=>setType(event.target.value as Return["type"])} className="h-11 w-full rounded-xl border border-border-field bg-surface px-3"><option value="reintegro" disabled={remaining===0}>Reintegro: solo dinero</option><option value="devolucion" disabled={returned || remaining===0}>Devolución: dinero y pedido completo</option><option value="retorno_fisico" disabled={returned}>Retorno físico: solo inventario, sin dinero</option></select></Field>
        <p className="text-sm text-text-secondary">{type!=="reintegro"?"Se restituirá todo el inventario de este pedido, una sola vez.":"El inventario no cambiará."} {type==="retorno_fisico"?"No registra reintegro ni reduce ventas netas.":physical?"Requiere una sesión abierta en la misma caja. Conserva el método efectivo/QR original.":"Esta operación registra el reintegro; la transferencia bancaria se realiza y verifica fuera del sistema."}</p>
        {type!=="retorno_fisico" && <Field label="Monto a devolver (Bs)" hint={`Disponible: Bs ${formatMoney(remaining)}`} required><Input type="number" min="0.01" max={remaining} step="0.01" required value={amount} onChange={event=>setAmount(event.target.value)} /></Field>}
        <Field label="Motivo" required><Textarea required maxLength={500} value={reason} onChange={event=>setReason(event.target.value)} /></Field>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={()=>{setEditing(false);setError("");}}>Volver</Button><Button type="submit" variant="destructive" loading={busy} loadingText="Registrando…">Confirmar operación</Button></div>
      </fieldset>
    </form>}
  </section>;
}
