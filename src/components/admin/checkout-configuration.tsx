"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Qr = { qr_public_url: string; account_label: string | null; is_active: boolean };
type Whatsapp = { phone_number: string; is_active: boolean };
type Hours = { day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean };
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const inputStyle = "rounded border p-2";

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "No se pudo completar la operación.");
  return result;
}

export function CheckoutConfiguration() {
  const [qr, setQr] = useState<Qr | null>(null);
  const [whatsapp, setWhatsapp] = useState<Whatsapp | null>(null);
  const [hours, setHours] = useState<Hours[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const [q, w, h] = await Promise.all([api("/api/admin/payment-qr"), api("/api/admin/whatsapp-config"), api("/api/admin/business-hours")]);
    setQr(q.qr_config); setWhatsapp(w.whatsapp_config); setHours(h.hours);
  }
  useEffect(() => {
    const timer = setTimeout(() => { void load().catch(error => setMessage(error.message)); }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function save(action: () => Promise<unknown>) {
    setPending(true); setMessage("");
    try { await action(); await load(); setMessage("Configuración guardada."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setPending(false); }
  }
  const deactivate = (kind: string) => save(() => api(`/api/admin/${kind}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: false }) }));

  return <>
    <p role="status" aria-live="polite">{message}</p>
    <Card className="flex flex-col gap-4">
      <h2>QR de pago</h2>
      {qr ? <><p>{qr.is_active ? "Activo" : "Desactivado"} · {qr.account_label || "Sin etiqueta"}</p><Image src={qr.qr_public_url} alt="QR configurado" width={240} height={240} unoptimized /></> : <p>Sin QR configurado. El checkout de pago necesita una imagen válida.</p>}
      <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void save(() => api("/api/admin/payment-qr", { method: "POST", body: data })); }}>
        <label>Imagen PNG/JPG/WebP, máximo 5 MB<input className={inputStyle} name="file" type="file" accept="image/png,image/jpeg,image/webp" required disabled={pending} /></label>
        <label>Nombre de cuenta<input className={inputStyle} name="account_label" maxLength={200} defaultValue={qr?.account_label || ""} /></label>
        <Button type="submit" disabled={pending}>Guardar y activar QR</Button>
      </form>
      {qr?.is_active && <Button variant="outline" disabled={pending} onClick={() => void deactivate("payment-qr")}>Desactivar QR</Button>}
    </Card>
    <Card className="flex flex-col gap-4">
      <h2>WhatsApp</h2><p>{whatsapp ? `${whatsapp.phone_number} · ${whatsapp.is_active ? "Activo" : "Desactivado"}` : "Sin número configurado."}</p>
      <form className="flex flex-col gap-3" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void save(() => api("/api/admin/whatsapp-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone_number: data.get("phone_number") }) })); }}>
        <label>Número internacional (código de país y número, solo dígitos)<input className={inputStyle} name="phone_number" type="tel" pattern="[0-9]{7,15}" required defaultValue={whatsapp?.phone_number || ""} /></label>
        <Button type="submit" disabled={pending}>Guardar y activar WhatsApp</Button>
      </form>
      {whatsapp?.is_active && <Button variant="outline" disabled={pending} onClick={() => void deactivate("whatsapp-config")}>Desactivar WhatsApp</Button>}
    </Card>
    <Card className="flex flex-col gap-4">
      <h2>Horarios · America/La_Paz</h2>
      {hours.map(day => <form key={day.day_of_week} className="flex flex-wrap items-center gap-3" onSubmit={event => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        const isClosed = data.get("is_closed") === "on";
        const body = { is_closed: isClosed, ...(data.get("opens_at") ? { opens_at: data.get("opens_at") } : {}), ...(data.get("closes_at") ? { closes_at: data.get("closes_at") } : {}) };
        void save(() => api(`/api/admin/business-hours/${day.day_of_week}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
      }}>
        <strong>{DAYS[day.day_of_week]}</strong>
        <label>Cerrado<input name="is_closed" type="checkbox" defaultChecked={day.is_closed} /></label>
        <label>Apertura<input className={inputStyle} name="opens_at" type="time" defaultValue={day.opens_at?.slice(0, 5) || ""} /></label>
        <label>Cierre<input className={inputStyle} name="closes_at" type="time" defaultValue={day.closes_at?.slice(0, 5) || ""} /></label>
        <Button type="submit" disabled={pending}>Guardar {DAYS[day.day_of_week]}</Button>
      </form>)}
    </Card>
  </>;
}
