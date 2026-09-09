"use client";

import { useEffect, useState } from "react";

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
      `/api/admin/system-settings/${encodeURIComponent(setting.key)}`,
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
    return <p>Cargando configuración...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm">{error}</p>

        <button
          onClick={loadSettings}
          className="mt-3 rounded-md border px-4 py-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settings.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p>No hay configuraciones registradas.</p>
        </div>
      ) : (
        settings.map((setting) => (
          <div
            key={setting.key}
            className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold">{setting.key}</p>

              <p className="text-sm text-muted-foreground">
                Valor:{" "}
                {typeof setting.value === "string"
                  ? setting.value
                  : JSON.stringify(setting.value)}
              </p>

              <p className="text-sm text-muted-foreground">
                {setting.is_critical
                  ? "Configuración crítica"
                  : "Configuración normal"}
              </p>
            </div>

            <button
              onClick={() => updateSetting(setting)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Modificar
            </button>
          </div>
        ))
      )}
    </div>
  );
}