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
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (setting.key === "accept_orders_outside_hours") {
      const current = typeof setting.value === "object" && setting.value !== null && "enabled" in setting.value && setting.value.enabled === true;
      try {
        const response = await fetch("/api/admin/system-settings/accept-orders-outside-hours", {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !current }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "No se pudo actualizar.");
        await loadSettings();
      } catch (error) { setError(error instanceof Error ? error.message : "No se pudo actualizar."); }
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
        settings.map((setting) => (
          <Card
            key={setting.key}
            className="flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-text">{setting.key === "accept_orders_outside_hours" ? "Aceptar pedidos fuera de horario" : setting.key}</p>
              <p className="text-text-secondary">
                Valor:{" "}
                {typeof setting.value === "string"
                  ? setting.value
                  : JSON.stringify(setting.value)}
              </p>
              <div className="mt-1">
                <Badge variant={setting.is_critical ? "outline" : "brand"}>
                  {setting.is_critical ? "Configuración crítica" : "Configuración normal"}
                </Badge>
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={() => void updateSetting(setting)}>
              {setting.key === "accept_orders_outside_hours" ? "Cambiar permitido/cerrado" : "Modificar"}
            </Button>
          </Card>
        ))
      )}
    </div>
  );
}
