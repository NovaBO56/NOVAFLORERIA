"use client";
import { useEffect, useState, useRef } from "react";
import { storeLocationSchema, storeMapPreview, mapsDestination } from "@/validations/store-location";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const labels = { branch_name: "Nombre de sucursal", address: "Dirección", reference: "Referencia", maps_url: "Enlace de Google Maps", latitude: "Latitud", longitude: "Longitud", directions: "Cómo llegar" };
export function StoreLocationConfiguration() {
  const [form, setForm] = useState<Record<string, string>>({}); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const lock = useRef(false);
  const [previewForm, setPreviewForm] = useState(form);
  useEffect(() => { const timer = setTimeout(() => setPreviewForm(form), 350); return () => clearTimeout(timer); }, [form]);
  const preview = storeMapPreview(previewForm);
  const parsedLocation = storeLocationSchema.safeParse(previewForm);
  const maps = parsedLocation.success ? mapsDestination(parsedLocation.data) : null;
  useEffect(() => { const controller = new AbortController(); void fetch("/api/admin/store-location", { signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw Error(data.message); setForm(Object.fromEntries(Object.entries(data.location).map(([key, value]) => [key, value === null ? "" : String(value)]))); }).catch(() => { if (!controller.signal.aborted) setMessage("No se pudo cargar la ubicación. Recarga para reintentar."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, []);
  return <Card><h2>Ubicación de la tienda</h2>{loading ? <p role="status">Cargando ubicación…</p> : <form className="grid gap-4 sm:grid-cols-2" onSubmit={async event => { event.preventDefault(); if (lock.current) return; const parsed = storeLocationSchema.safeParse(form); if (!parsed.success) { setMessage(parsed.error.issues[0].message); return; } lock.current = true; setBusy(true); setMessage(""); try { const response = await fetch("/api/admin/store-location", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) }); const data = await response.json(); if (!response.ok) throw Error(data.message); setMessage("Ubicación guardada."); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); } finally { lock.current = false; setBusy(false); } }}>
    {Object.entries(labels).map(([key, label]) => <Field key={key} label={label}><Input value={form[key] ?? ""} maxLength={key === "maps_url" ? 2000 : 400} inputMode={key === "latitude" || key === "longitude" ? "decimal" : "text"} disabled={busy} onChange={event => { setForm(current => ({ ...current, [key]: event.target.value })); setMessage(""); }} /></Field>)}
    <section className="min-w-0 space-y-2 sm:col-span-2"><h3 className="font-semibold">Vista previa antes de guardar</h3>{preview ? <iframe title="Vista previa de la ubicación de la tienda" src={preview} loading="lazy" referrerPolicy="no-referrer" className="h-64 w-full max-w-full rounded-xl border" /> : <p className="text-sm text-muted-foreground">Completa una latitud y longitud válidas para comprobar el marcador. Un enlace de Maps puede guardarse sin coordenadas.</p>}{maps ? <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">Abrir en Google Maps / Cómo llegar</a> : null}<p className="text-xs text-muted-foreground">El mapa se actualiza con las coordenadas; los cambios no se guardan hasta pulsar Guardar ubicación.</p></section>
    <Button type="submit" loading={busy}>Guardar ubicación</Button>
  </form>}{message ? <p role="status">{message}</p> : null}</Card>;
}
