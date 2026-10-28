"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { notificationPresentation } from "@/lib/notification-presentation";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

type Notification = { id: string; message: string; created_at: string };
export function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
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
    const initial = setTimeout(refresh, 0); const interval = setInterval(refresh, 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [refresh]);
  async function markRead(id: string) {
    if (lock.current) return;
    lock.current = true; setPending(id); setFeedback("");
    try {
      const response = await fetch("/api/admin/notifications/" + id + "/read", { method: "POST" });
      if (!response.ok) throw new Error("No se pudo marcar la notificación. Intenta nuevamente.");
      await load(); setFeedback("Notificación marcada como leída.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo actualizar la notificación."); }
    finally { lock.current = false; setPending(""); }
  }
  return <details className="nova-notifications admin-notifications relative min-w-0">
    <summary aria-label={"Notificaciones: " + (loading ? "cargando" : items.length + " pendientes")} title="Notificaciones"><Bell aria-hidden className="size-5" />{!loading && items.length > 0 && <span aria-hidden className="admin-notification-count">{items.length > 99 ? "99+" : items.length}</span>}</summary>
    <div className="fixed inset-x-4 top-16 z-50 mt-2 max-h-[70dvh] overflow-auto rounded-xl border border-border-decorative bg-surface p-4 text-text shadow-overlay sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:w-96 sm:max-w-[calc(100vw-2rem)]">
      <div className="mb-4 border-b border-border-decorative pb-3"><p className="font-semibold">Notificaciones</p><p className="mt-1 text-xs text-text-secondary">Avisos compartidos del equipo · {items.length} pendientes</p></div>
      {error && <Notice tone="error" title="No pudimos actualizar los avisos" className="mb-3">{friendlyErrorMessage(error, "Intenta cargar las notificaciones nuevamente.")}<Button variant="outline" size="sm" className="mt-2" onClick={refresh}>Reintentar</Button></Notice>}
      {feedback && <Notice tone="success" className="mb-3" onDismiss={() => setFeedback("")}>{feedback}</Notice>}
      {loading ? <p role="status">Cargando notificaciones…</p> : !error && items.length === 0 ? <Notice announce={false} title="Todo al día">No hay notificaciones pendientes.</Notice> : null}
      <ul className="space-y-3" aria-label="Avisos pendientes">{items.map(item => {
        const presentation = notificationPresentation(item.message);
        return <li key={item.id} aria-busy={pending === item.id}><Notice announce={false} tone={presentation.tone} title={presentation.title}>
          <p>{presentation.message}</p>
          <time className="mt-2 block text-xs opacity-80" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("es-BO", { timeZone: "America/La_Paz" })}</time>
          <Button className="mt-3" size="sm" variant="outline" loading={pending === item.id} disabled={Boolean(pending)} onClick={() => void markRead(item.id)}>Marcar leída</Button>
        </Notice></li>;
      })}</ul>
    </div>
  </details>;
}
