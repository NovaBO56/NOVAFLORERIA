"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AuditEntries() {
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      fetch(`/api/admin/audit-log?limit=50&offset=${offset}`, { signal: controller.signal }).then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "No se pudo cargar la auditoría.");
        if (!controller.signal.aborted) setEntries(result.entries);
      }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [offset,retry]);
  return <>
    <p className="text-text-secondary">Registro administrativo compartido. Página {offset / 50 + 1}.</p>
    {error ? <Card><p role="alert" className="text-danger">{error}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Reintentar</Button></Card> : loading ? <Card role="status">Cargando registros…</Card> : entries.length === 0 ? <Card><p>No hay registros en esta página.</p></Card> : entries.map((entry,index) => <details key={String(entry.id || `${offset}-${index}`)} className="min-w-0 rounded-xl border border-border-decorative bg-surface p-4 shadow-card">
      <summary className="cursor-pointer break-words font-medium focus-visible:outline-2 focus-visible:outline-brand">{new Date(String(entry.created_at)).toLocaleString("es-BO",{timeZone:"America/La_Paz"})} · {String(entry.action || entry.source || "Evento")} · {String(entry.table_name || "")}</summary>
      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-brand-soft/40 p-3 text-xs">{JSON.stringify(entry,null,2)}</pre>
    </details>)}
    <nav aria-label="Páginas de auditoría" className="flex flex-wrap gap-3"><Button variant="outline" disabled={loading || offset === 0} onClick={() => setOffset(value => Math.max(0,value-50))}>Anterior</Button><Button variant="outline" disabled={loading || Boolean(error) || entries.length < 50} onClick={() => setOffset(value => value+50)}>Siguiente</Button></nav>
  </>;
}