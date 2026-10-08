"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function AuditEntries() {
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/audit-log?limit=50&offset=${offset}`, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setEntries(result.entries); setError("");
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [offset]);
  return <><p role="alert">{error}</p><p>Registro administrativo compartido. Página {offset / 50 + 1}.</p>
    {entries.map((entry, index) => <details key={String(entry.id || `${offset}-${index}`)} className="rounded border p-3"><summary>{String(entry.created_at || "")} · {String(entry.action || entry.source || "Evento")} · {String(entry.table_name || "")}</summary><pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(entry, null, 2)}</pre></details>)}
    <div className="flex gap-3"><Button disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 50))}>Anterior</Button><Button disabled={entries.length < 50} onClick={() => setOffset(value => value + 50)}>Siguiente</Button></div></>;
}
