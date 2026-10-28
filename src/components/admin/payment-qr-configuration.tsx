"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { qrSlots, qrSlotLabel, type PaymentQr, type QrSlot } from "@/lib/public/payment-qrs";

import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";

type Config = PaymentQr & { id: string; is_active: boolean };
async function request(options?: RequestInit) {
  const response = await fetch("/api/admin/payment-qr", options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "No se pudo guardar el QR.");
  return result;
}
export function PaymentQrConfiguration() {
  const [configs, setConfigs] = useState<Config[] | null>(null);
  const [error, setError] = useState("");
  async function load() {
    try { setConfigs((await request()).qr_configs); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar."); }
  }
  useEffect(() => { let mounted = true; request().then(result => { if (mounted) setConfigs(result.qr_configs); }).catch(cause => { if (mounted) setError(cause instanceof Error ? cause.message : "No se pudo cargar."); }); return () => { mounted = false; }; }, []);
  return <section className="min-w-0 space-y-4" aria-label="QR de pago"><div><h2 className="text-lg font-semibold text-text">QR de pago</h2><p className="mt-1 text-sm text-text-secondary">Administra las cuentas disponibles. Verifica el banco antes de confirmar un pago.</p></div>{error ? <Notice tone="error">{friendlyErrorMessage(error)}<Button className="mt-2" onClick={() => void load()}>Reintentar</Button></Notice> : null}{configs ? <div className="grid min-w-0 gap-6 xl:grid-cols-2">{qrSlots.map(slot => <QrCard key={`${slot}-${configs.find(qr => qr.qr_slot === slot)?.id || "empty"}`} slot={slot} config={configs.find(qr => qr.qr_slot === slot)} saved={load} />)}</div> : <p role="status">Cargando QR…</p>}</section>;
}
function QrCard({ slot, config, saved }: { slot: QrSlot; config?: Config; saved: () => Promise<void> }) {
  const [label, setLabel] = useState(config?.account_label || qrSlotLabel(slot));
  const [active, setActive] = useState(config?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function submit() {
    if (lock.current) return;
    setMessageTone("error");
    if (!file && !config) { setMessage("Selecciona una imagen antes de guardar."); return; }
    lock.current = true; setBusy(true); setMessage("");
    try {
      if (file) {
        const body = new FormData(); body.set("file", file); body.set("qr_slot", slot); body.set("account_label", label); body.set("is_active", String(active));
        await request({ method: "POST", body });
      } else await request({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr_slot: slot, account_label: label, is_active: active }) });
      setFile(null); setPreview(""); if (input.current) input.current.value = "";
      await saved(); setMessageTone("success"); setMessage("QR guardado.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "No se pudo guardar."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SectionCard title={qrSlotLabel(slot)} description="Imagen y nombre de la cuenta que puede seleccionar el cliente." action={<Badge variant={config?.is_active ? "brand" : "outline"}>{config?.is_active ? "Activo" : "Inactivo"}</Badge>}>{preview || config?.qr_public_url ? <Image unoptimized src={preview || config!.qr_public_url} alt={`Imagen ${qrSlotLabel(slot)}`} width={220} height={220} className="mx-auto h-52 w-full max-w-64 rounded-xl border border-border-decorative bg-bg-admin p-3 object-contain" /> : <p className="grid min-h-52 place-items-center rounded-xl border border-dashed border-border-decorative bg-bg-admin p-5 text-sm text-text-secondary">Sin imagen configurada.</p>}<form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(); }}><Field label={`Imagen ${qrSlotLabel(slot)}`} hint="PNG, JPG o WebP. Máximo 5 MB."><input ref={input} className="w-full min-w-0 text-sm" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => {
    const next = event.target.files?.[0]; setFile(null); setPreview(""); setMessage(""); setMessageTone("error");
    if (!next) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(next.type) || next.size === 0 || next.size > 5 * 1024 * 1024) { setMessage("Selecciona una imagen válida de hasta 5 MB."); event.target.value = ""; return; }
    setFile(next); setPreview(URL.createObjectURL(next));
  }} /></Field><Field label={`Etiqueta ${qrSlotLabel(slot)}`} required><Input required maxLength={200} value={label} disabled={busy} onChange={event => setLabel(event.target.value)} /></Field><label className="flex min-h-11 items-center gap-2 rounded-lg bg-bg-admin px-3 text-sm"><input type="checkbox" className="size-4 accent-brand" checked={active} disabled={busy} onChange={event => setActive(event.target.checked)} />{qrSlotLabel(slot)} activo</label><Button type="submit" loading={busy} disabled={busy}>Guardar {qrSlotLabel(slot)}</Button></form>{message ? <Notice tone={messageTone} onDismiss={() => setMessage("")}>{messageTone === "error" ? friendlyErrorMessage(message) : message}</Notice> : null}</SectionCard>;
}
