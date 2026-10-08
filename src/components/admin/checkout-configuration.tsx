"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

type Qr = { qr_public_url: string; account_label: string | null; is_active: boolean };
type Whatsapp = { phone_number: string; is_active: boolean };
type Hours = { day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean };
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "No se pudo completar la operación.");
  return result;
}
const json = (body: unknown, method = "POST") => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function CheckoutConfiguration() {
  const [qr, setQr] = useState<Qr | null>(null);
  const [whatsapp, setWhatsapp] = useState<Whatsapp | null>(null);
  const [hours, setHours] = useState<Hours[]>([]);
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const lock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [q, w, h] = await Promise.all([api("/api/admin/payment-qr"), api("/api/admin/whatsapp-config"), api("/api/admin/business-hours")]);
    setQr(q.qr_config); setWhatsapp(w.whatsapp_config); setHours(h.hours);
    setLabel(q.qr_config?.account_label || ""); setPhone(w.whatsapp_config?.phone_number || "");
  }, []);
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar la configuración."); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { const timer = setTimeout(() => { void reload(); }, 0); return () => clearTimeout(timer); }, [reload]);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  async function save(kind: string, action: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true; setPending(kind); setMessage(""); setError("");
    try { await action(); await load(); setMessage("Configuración guardada."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar. Puedes reintentar."); }
    finally { lock.current = false; setPending(""); }
  }
  function chooseFile(selected: File | undefined) {
    setError(""); setFile(null); setPreview("");
    if (!selected) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selected.type) || selected.size === 0 || selected.size > 5 * 1024 * 1024) {
      setError("Selecciona una imagen PNG, JPG o WebP válida de hasta 5 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(selected); setPreview(URL.createObjectURL(selected));
  }
  const deactivate = (kind: string) => save(kind, () => api(`/api/admin/${kind}`, json({ is_active: false }, "PATCH")));
  const updateDay = (day: number, values: Partial<Hours>) => setHours(current => current.map(item => item.day_of_week === day ? { ...item, ...values } : item));

  if (loading) return <Card role="status" aria-live="polite"><p>Cargando configuración…</p></Card>;
  if (error && hours.length === 0) return <Card><p role="alert" className="text-danger">{error}</p><Button variant="outline" onClick={() => void reload()}>Reintentar</Button></Card>;

  return <>
    {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-leaf/30 bg-leaf/5 p-4 text-leaf">{message}</p>}
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2>QR de pago</h2><Badge variant="outline">{qr?.is_active ? "Activo" : "Inactivo"}</Badge></div>
        {file || qr ? <div className="flex min-h-40 items-center justify-center rounded-xl border border-border-decorative bg-white p-4"><Image src={file ? preview || qr?.qr_public_url || "" : qr!.qr_public_url} alt={file ? "Vista previa del nuevo QR" : "QR configurado"} width={200} height={200} className="max-h-52 max-w-full object-contain" unoptimized /></div> : <p className="text-text-secondary">Sin QR configurado. Sube la imagen que utilizarán tus clientes para pagar.</p>}
        <form className="flex flex-col gap-4" onSubmit={event => {
          event.preventDefault(); if (!file) { setError("Selecciona la imagen del QR."); return; }
          const data = new FormData(); data.set("file", file); data.set("account_label", label);
          void save("qr", async () => { await api("/api/admin/payment-qr", { method: "POST", body: data }); setFile(null); setPreview(""); if (fileInput.current) fileInput.current.value = ""; });
        }}>
          <Field label="Imagen del QR" hint="PNG, JPG o WebP. Máximo 5 MB." required><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" required disabled={Boolean(pending)} onChange={event => chooseFile(event.target.files?.[0])} className="w-full min-w-0 rounded-xl border border-border-field p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-brand focus-visible:outline-2 focus-visible:outline-brand" /></Field>
          <Field label="Nombre de cuenta" optional><Input value={label} maxLength={200} onChange={event => setLabel(event.target.value)} disabled={Boolean(pending)} /></Field>
          <Button type="submit" loading={pending === "qr"} loadingText="Guardando QR…" disabled={Boolean(pending)}>{qr ? "Reemplazar y activar QR" : "Guardar y activar QR"}</Button>
        </form>
        {qr?.is_active && <Button variant="outline" loading={pending === "payment-qr"} disabled={Boolean(pending)} onClick={() => void deactivate("payment-qr")}>Desactivar QR</Button>}
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2>WhatsApp</h2><Badge variant="outline">{whatsapp?.is_active ? "Activo" : "Inactivo"}</Badge></div>
        <p className="break-all text-text-secondary">{whatsapp ? whatsapp.phone_number : "Sin número configurado."}</p>
        <form className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); void save("wa", () => api("/api/admin/whatsapp-config", json({ phone_number: phone }))); }}>
          <Field label="Número internacional" hint="Incluye el código de país. Solo dígitos, entre 7 y 15." required><Input type="tel" inputMode="tel" pattern="[0-9]{7,15}" maxLength={15} required value={phone} onChange={event => setPhone(event.target.value)} disabled={Boolean(pending)} /></Field>
          <Button type="submit" loading={pending === "wa"} loadingText="Guardando…" disabled={Boolean(pending)}>Guardar y activar WhatsApp</Button>
        </form>
        {whatsapp?.is_active && <Button variant="outline" loading={pending === "whatsapp-config"} disabled={Boolean(pending)} onClick={() => void deactivate("whatsapp-config")}>Desactivar WhatsApp</Button>}
      </Card>
    </div>
    <Card>
      <h2>Horarios de atención</h2><p className="text-text-secondary">Hora local de Bolivia · America/La_Paz. Guarda cada día después de editarlo.</p>
      <div className="grid gap-4">
        {hours.map(day => <form key={day.day_of_week} aria-label={`Horario ${DAYS[day.day_of_week]}`} className="grid gap-3 rounded-xl border border-border-decorative p-4 sm:grid-cols-2 xl:grid-cols-[8rem_7rem_1fr_1fr_auto] xl:items-end" onSubmit={event => {
          event.preventDefault(); if (!day.is_closed && (!day.opens_at || !day.closes_at || day.opens_at >= day.closes_at)) { setError(`Revisa ${DAYS[day.day_of_week]}: apertura debe ser anterior al cierre.`); return; }
          const body = { is_closed: day.is_closed, ...(day.opens_at ? { opens_at: day.opens_at.slice(0,5) } : {}), ...(day.closes_at ? { closes_at: day.closes_at.slice(0,5) } : {}) };
          void save(`day-${day.day_of_week}`, () => api(`/api/admin/business-hours/${day.day_of_week}`, json(body,"PATCH")));
        }}>
          <h3 className="self-center font-semibold">{DAYS[day.day_of_week]}</h3>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={day.is_closed} onChange={event => updateDay(day.day_of_week,{is_closed:event.target.checked})} disabled={Boolean(pending)} className="size-4 accent-brand" />Cerrado</label>
          <Field label={`Apertura ${DAYS[day.day_of_week]}`}><Input type="time" required={!day.is_closed} value={day.opens_at?.slice(0,5) || ""} onChange={event => updateDay(day.day_of_week,{opens_at:event.target.value})} disabled={Boolean(pending) || day.is_closed} /></Field>
          <Field label={`Cierre ${DAYS[day.day_of_week]}`}><Input type="time" required={!day.is_closed} value={day.closes_at?.slice(0,5) || ""} onChange={event => updateDay(day.day_of_week,{closes_at:event.target.value})} disabled={Boolean(pending) || day.is_closed} /></Field>
          <Button type="submit" variant="outline" loading={pending === `day-${day.day_of_week}`} disabled={Boolean(pending)}>Guardar {DAYS[day.day_of_week]}</Button>
        </form>)}
      </div>
    </Card>
  </>;
}