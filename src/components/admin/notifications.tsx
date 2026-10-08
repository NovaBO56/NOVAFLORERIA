"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Notification = { id: string; message: string; created_at: string };
export function Notifications() {
  const [items,setItems] = useState<Notification[]>([]);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const [pending,setPending] = useState("");
  const lock = useRef(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications?unread=true");
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No se pudieron cargar las notificaciones.");
      setItems(result.notifications); setError("");
    } finally { setLoading(false); }
  }, []);
  const refresh = useCallback(() => { void load().catch(cause => setError(cause instanceof Error ? cause.message : "No se pudieron cargar.")); }, [load]);
  useEffect(() => {
    const initial = setTimeout(refresh,0); const interval = setInterval(refresh,30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [refresh]);
  async function markRead(id: string) {
    if (lock.current) return;
    lock.current=true; setPending(id);
    try {
      const response = await fetch(`/api/admin/notifications/${id}/read`,{method:"POST"});
      if (!response.ok) throw new Error("No se pudo marcar la notificación.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error de notificaciones."); }
    finally { lock.current=false; setPending(""); }
  }
  return <details className="nova-notifications relative min-w-0"><summary className="cursor-pointer rounded-lg px-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand"><span className="hidden sm:inline">Notificaciones</span><span className="sm:hidden">Avisos</span> ({loading ? "…" : items.length})</summary>
    <div className="fixed inset-x-4 top-16 z-50 mt-2 max-h-[70dvh] overflow-auto rounded-xl border border-border-decorative bg-surface p-4 text-text shadow-overlay sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:w-80 sm:max-w-[calc(100vw-2rem)]">
      <p className="mb-3 text-sm text-text-secondary">Bandeja compartida del personal.</p>
      {error ? <div><p role="alert" className="text-danger">{error}</p><Button variant="outline" size="sm" onClick={refresh}>Reintentar</Button></div> : loading ? <p role="status">Cargando notificaciones…</p> : items.length === 0 ? <p>Sin notificaciones pendientes.</p> : null}
      {items.map(item => <div key={item.id} aria-busy={pending === item.id} className="nova-notification nova-fade flex flex-col items-start gap-2 border-b border-border-decorative py-3"><p className="break-words text-sm">{item.message}</p><time className="text-xs text-text-secondary" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("es-BO",{timeZone:"America/La_Paz"})}</time><Button size="sm" variant="outline" loading={pending === item.id} disabled={Boolean(pending)} onClick={() => void markRead(item.id)}>Marcar leída</Button></div>)}
    </div>
  </details>;
}
