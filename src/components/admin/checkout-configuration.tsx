"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StoreLocationConfiguration } from "./store-location";
import { PaymentQrConfiguration } from "./payment-qr-configuration";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";

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
  const [whatsapp, setWhatsapp] = useState<Whatsapp | null>(null);
  const [hours, setHours] = useState<Hours[]>([]);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const lock = useRef(false);

  const load = useCallback(async () => {
    const [w, h] = await Promise.all([api("/api/admin/whatsapp-config"), api("/api/admin/business-hours")]);
    setWhatsapp(w.whatsapp_config); setHours(h.hours);
    setPhone(w.whatsapp_config?.phone_number || "");
  }, []);
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar la configuración."); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { const timer = setTimeout(() => { void reload(); }, 0); return () => clearTimeout(timer); }, [reload]);
  async function save(kind: string, action: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true; setPending(kind); setMessage(""); setError("");
    try { await action(); await load(); setMessage("Configuración guardada."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar. Puedes reintentar."); }
    finally { lock.current = false; setPending(""); }
  }
  const deactivate = (kind: string) => save(kind, () => api(`/api/admin/${kind}`, json({ is_active: false }, "PATCH")));
  const updateDay = (day: number, values: Partial<Hours>) => setHours(current => current.map(item => item.day_of_week === day ? { ...item, ...values } : item));

  if (loading) return <Card role="status" aria-live="polite"><p>Cargando configuración…</p></Card>;
  if (error && hours.length === 0) return <Card><Notice tone="error">{friendlyErrorMessage(error)}</Notice><Button variant="outline" onClick={() => void reload()}>Reintentar</Button></Card>;

  return <>
    <StoreLocationConfiguration />
    <PaymentQrConfiguration />
    {error && <Notice tone="error" title="Revisa la configuración">{friendlyErrorMessage(error)}</Notice>}
    {message && <Notice tone="success" title="Cambios guardados" onDismiss={() => setMessage("")}>{message}</Notice>}
    <SectionCard title="Contacto por WhatsApp" description="Número de atención que se utiliza en el flujo de pedidos." action={<Badge variant="outline">{whatsapp?.is_active ? "Activo" : "Inactivo"}</Badge>}>
        <p className="mb-4 break-all text-sm text-text-secondary">{whatsapp ? whatsapp.phone_number : "Sin número configurado."}</p>
        <form className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={event => { event.preventDefault(); void save("wa", () => api("/api/admin/whatsapp-config", json({ phone_number: phone }))); }}>
          <Field label="Número internacional" hint="Incluye el código de país. Solo dígitos, entre 7 y 15." required><Input type="tel" inputMode="tel" pattern="[0-9]{7,15}" maxLength={15} required value={phone} onChange={event => setPhone(event.target.value)} disabled={Boolean(pending)} /></Field>
          <Button type="submit" loading={pending === "wa"} loadingText="Guardando…" disabled={Boolean(pending)}>Guardar y activar WhatsApp</Button>
        </form>
        {whatsapp?.is_active && <Button className="mt-3" variant="outline" loading={pending === "whatsapp-config"} disabled={Boolean(pending)} onClick={() => void deactivate("whatsapp-config")}>Desactivar WhatsApp</Button>}
    </SectionCard>
    <SectionCard title="Horarios de atención" description="Hora local de Bolivia. Guarda cada día después de editar sus horarios.">
      <div className="grid gap-4">
        {hours.map(day => <form key={day.day_of_week} aria-label={`Horario ${DAYS[day.day_of_week]}`} className="grid min-w-0 gap-3 rounded-xl border border-border-decorative bg-bg-admin p-4 sm:grid-cols-2 xl:grid-cols-[7rem_6rem_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end" onSubmit={event => {
          event.preventDefault(); if (!day.is_closed && (!day.opens_at || !day.closes_at || day.opens_at >= day.closes_at)) { setError(`Revisa ${DAYS[day.day_of_week]}: apertura debe ser anterior al cierre.`); return; }
          const body = { is_closed: day.is_closed, ...(day.opens_at ? { opens_at: day.opens_at.slice(0,5) } : {}), ...(day.closes_at ? { closes_at: day.closes_at.slice(0,5) } : {}) };
          void save(`day-${day.day_of_week}`, () => api(`/api/admin/business-hours/${day.day_of_week}`, json(body,"PATCH")));
        }}>
          <h3 className="self-center text-sm font-semibold">{DAYS[day.day_of_week]}</h3>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={day.is_closed} onChange={event => updateDay(day.day_of_week,{is_closed:event.target.checked})} disabled={Boolean(pending)} className="size-4 accent-brand" />Cerrado</label>
          <Field label={`Apertura ${DAYS[day.day_of_week]}`}><Input type="time" required={!day.is_closed} value={day.opens_at?.slice(0,5) || ""} onChange={event => updateDay(day.day_of_week,{opens_at:event.target.value})} disabled={Boolean(pending) || day.is_closed} /></Field>
          <Field label={`Cierre ${DAYS[day.day_of_week]}`}><Input type="time" required={!day.is_closed} value={day.closes_at?.slice(0,5) || ""} onChange={event => updateDay(day.day_of_week,{closes_at:event.target.value})} disabled={Boolean(pending) || day.is_closed} /></Field>
          <Button type="submit" variant="outline" loading={pending === `day-${day.day_of_week}`} disabled={Boolean(pending)}>Guardar {DAYS[day.day_of_week]}</Button>
        </form>)}
      </div>
    </SectionCard>
  </>;
}
