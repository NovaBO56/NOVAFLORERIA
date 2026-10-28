"use client";

import { useEffect, useState } from "react";
import { Field, Textarea } from "@/components/ui/field";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";

type SystemSetting = {
  key: string;
  value: unknown;
  is_critical: boolean;
  updated_at?: string;
  updated_by?: string | null;
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [settingValue, setSettingValue] = useState("");
  const [settingError, setSettingError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/system-settings");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? "No se pudieron cargar las configuraciones.",
        );
      }

      setSettings(result.settings ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las configuraciones.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  async function updateSetting(setting: SystemSetting, nextValue?: string) {
    if (pending) return;
    setNotice("");
    if (setting.key === "delivery_enabled") {
      const current = typeof setting.value === "object" && setting.value !== null && "enabled" in setting.value && setting.value.enabled === true;
      setPending(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/system-settings?key=${encodeURIComponent(setting.key)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: { enabled: !current } }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "No se pudo actualizar la disponibilidad de entrega.");
        await loadSettings(); setNotice("Disponibilidad de entrega actualizada.");
      } catch (error) { setError(error instanceof Error ? error.message : "No se pudo actualizar la disponibilidad de entrega."); }
      finally { setPending(false); }
      return;
    }
    if (setting.key === "accept_orders_outside_hours") {
      const current = typeof setting.value === "object" && setting.value !== null && "enabled" in setting.value && setting.value.enabled === true;
      setPending(true);
      try {
        const response = await fetch("/api/admin/system-settings/accept-orders-outside-hours", {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !current }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "No se pudo actualizar.");
        await loadSettings(); setNotice("Horario de recepción de pedidos actualizado.");
      } catch (error) { setError(error instanceof Error ? error.message : "No se pudo actualizar."); }
      finally { setPending(false); }
      return;
    }
    const value = nextValue;
    if (value === undefined) return;

    let parsedValue: unknown = value;

    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Si no es JSON válido, se conserva como texto.
    }

    setPending(true);
    setSettingError("");
    try {
      const response = await fetch(
        `/api/admin/system-settings?key=${encodeURIComponent(setting.key)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: parsedValue,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setSettingError(
          result.message ?? "No se pudo actualizar la configuración.",
        );
        return false;
      }

      await loadSettings(); setNotice("Configuración guardada.");
      return true;
    } catch (cause) {
      setSettingError(cause instanceof Error ? cause.message : "No se pudo actualizar la configuración.");
      return false;
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <Card className="h-32 animate-pulse" />;
  }

  if (error && settings.length === 0) {
    return (
      <Card className="items-center gap-2 text-center">
        <Notice tone="error">{friendlyErrorMessage(error)}</Notice>
        <Button variant="outline" onClick={() => void loadSettings()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <>
    {notice && <Notice tone="success" onDismiss={() => setNotice("")}>{notice}</Notice>}
    {error && <Notice tone="error">{friendlyErrorMessage(error)}</Notice>}
    <div className="flex flex-col gap-3">
      {settings.length === 0 ? (
        <Card className="items-center text-center">
          <p className="text-text-secondary">No hay configuraciones registradas.</p>
        </Card>
      ) : (
        settings.filter(setting => !["store_location", "storefront_media"].includes(setting.key)).map((setting) => (
          <Card
            key={setting.key}
            className="flex-col gap-4 border-border-decorative bg-bg-admin shadow-none md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 break-words">
              <p className="font-semibold text-text">{setting.key === "accept_orders_outside_hours" ? "Aceptar pedidos fuera de horario" : setting.key === "delivery_enabled" ? "Entrega a domicilio" : setting.key}</p>
              <p className="mt-1 break-words text-sm leading-6 text-text-secondary">
                Estado:{" "}
                {setting.key === "delivery_enabled" ? (((setting.value as {enabled?:boolean}).enabled === true) ? "Disponible para nuevos pedidos" : "Temporalmente no disponible; el recojo sigue habilitado") : setting.key === "accept_orders_outside_hours" ? ((setting.value as {enabled:boolean}).enabled ? "Pedidos permitidos fuera de horario" : "Solo dentro del horario de atención") : typeof setting.value === "string"
                  ? setting.value
                  : JSON.stringify(setting.value)}
              </p>
              <div className="mt-1">
                <Badge variant={setting.is_critical ? "outline" : "brand"}>
                  {setting.is_critical ? "Configuración crítica" : "Configuración normal"}
                </Badge>
              </div>
            </div>

            {setting.key === "delivery_enabled" ? <button type="button" role="switch" aria-checked={(setting.value as {enabled?:boolean}).enabled === true} aria-label="Entrega a domicilio" disabled={pending} onClick={() => void updateSetting(setting)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${(setting.value as {enabled?:boolean}).enabled === true ? "bg-brand" : "bg-gray-300"}`}><span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${(setting.value as {enabled?:boolean}).enabled === true ? "translate-x-6" : "translate-x-1"}`}/><span className="sr-only">{(setting.value as {enabled?:boolean}).enabled === true ? "Activada" : "Desactivada"}</span></button> : <Button size="sm" variant="outline" loading={pending} disabled={pending} onClick={() => { if (setting.key === "accept_orders_outside_hours") { void updateSetting(setting); } else { setEditingSetting(setting); setSettingError(""); setSettingValue(typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value, null, 2)); } }}>
              {setting.key === "accept_orders_outside_hours" ? ((setting.value as {enabled:boolean}).enabled ? "Desactivar pedidos fuera de horario" : "Permitir pedidos fuera de horario") : "Modificar"}
            </Button>}
          </Card>
        ))
      )}
    </div>
    <Modal open={Boolean(editingSetting)} onOpenChange={open => { if (!open && !pending) setEditingSetting(null); }}><ModalContent dismissible={!pending}><ModalHeader><ModalTitle>Modificar configuración</ModalTitle><ModalDescription>Revisa el valor antes de guardar. Esta opción puede afectar el funcionamiento de la tienda.</ModalDescription></ModalHeader><form className="space-y-4" onSubmit={async event => { event.preventDefault(); if (!editingSetting || pending) return; const saved = await updateSetting(editingSetting, settingValue); if (saved) setEditingSetting(null); }}><Field label={editingSetting?.key ?? "Valor"} error={settingError ? friendlyErrorMessage(settingError) : undefined}><Textarea value={settingValue} onChange={event => setSettingValue(event.target.value)} disabled={pending} className="font-mono text-sm" /></Field><ModalFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setEditingSetting(null)}>Cancelar</Button><Button type="submit" loading={pending}>Guardar cambios</Button></ModalFooter></form></ModalContent></Modal>
    </>
  );
}
