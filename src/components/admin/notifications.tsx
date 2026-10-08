"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Notification = { id: string; message: string; created_at: string };
export function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  async function load() {
    const response = await fetch("/api/admin/notifications?unread=true");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    setItems(result.notifications); setError("");
  }
  useEffect(() => {
    const refresh = () => { void load().catch(error => setError(error.message)); };
    const initial = setTimeout(refresh, 0); const interval = setInterval(refresh, 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);
  async function markRead(id: string) {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/read`, { method: "POST" });
      if (!response.ok) throw new Error("No se pudo marcar la notificación.");
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : "Error de notificaciones."); }
  }
  return <details className="relative"><summary className="cursor-pointer">Notificaciones ({items.length})</summary><div className="absolute right-0 z-50 max-h-96 w-80 overflow-auto rounded border bg-background p-4 shadow">
    <p role="alert">{error}</p><p className="text-sm">Bandeja compartida del personal.</p>
    {items.length === 0 && <p>Sin notificaciones pendientes.</p>}
    {items.map(item => <div key={item.id} className="border-b py-3"><p>{item.message}</p><Button size="sm" onClick={() => void markRead(item.id)}>Marcar leída</Button></div>)}
  </div></details>;
}
