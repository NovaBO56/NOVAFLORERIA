"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

  async function updateSetting(setting: SystemSetting) {
    if (pending) return;
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
        await loadSettings();
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
        await loadSettings();
      } catch (error) { setError(error instanceof Error ? error.message : "No se pudo actualizar."); }
      finally { setPending(false); }
      return;
    }
    const value = window.prompt(
      `Nuevo valor para "${setting.key}"`,
      typeof setting.value === "string"
        ? setting.value
        : JSON.stringify(setting.value),
    );

    if (value === null) {
      return;
    }

    let parsedValue: unknown = value;

    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Si no es JSON válido, se conserva como texto.
    }

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
      setError(
        result.message ?? "No se pudo actualizar la configuración.",
      );
      return;
    }

    await loadSettings();
  }

  if (loading) {
    return <Card className="h-32 animate-pulse" />;
  }

  if (error) {
    return (
      <Card className="items-center gap-2 text-center">
        <p className="text-text-secondary">{error}</p>
        <Button variant="outline" onClick={() => void loadSettings()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {settings.length === 0 ? (
        <Card className="items-center text-center">
          <p className="text-text-secondary">No hay configuraciones registradas.</p>
        </Card>
      ) : (
        settings.filter(setting => !["store_location", "storefront_media"].includes(setting.key)).map((setting) => (
          <Card
            key={setting.key}
            className="flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 break-words">
              <p className="font-semibold text-text">{setting.key === "accept_orders_outside_hours" ? "Aceptar pedidos fuera de horario" : setting.key === "delivery_enabled" ? "Entrega a domicilio" : setting.key}</p>
              <p className="break-all text-text-secondary">
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

            {setting.key === "delivery_enabled" ? <button type="button" role="switch" aria-checked={(setting.value as {enabled?:boolean}).enabled === true} aria-label="Entrega a domicilio" disabled={pending} onClick={() => void updateSetting(setting)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${(setting.value as {enabled?:boolean}).enabled === true ? "bg-brand" : "bg-gray-300"}`}><span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${(setting.value as {enabled?:boolean}).enabled === true ? "translate-x-6" : "translate-x-1"}`}/><span className="sr-only">{(setting.value as {enabled?:boolean}).enabled === true ? "Activada" : "Desactivada"}</span></button> : <Button size="sm" variant="outline" loading={pending} disabled={pending} onClick={() => void updateSetting(setting)}>
              {setting.key === "accept_orders_outside_hours" ? ((setting.value as {enabled:boolean}).enabled ? "Desactivar pedidos fuera de horario" : "Permitir pedidos fuera de horario") : "Modificar"}
            </Button>}
          </Card>
        ))
      )}
    </div>
  );
}
