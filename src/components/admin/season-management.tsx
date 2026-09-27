"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";

type Season = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SeasonForm = {
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
};

const initialForm: SeasonForm = {
  name: "",
  description: "",
  starts_at: "",
  ends_at: "",
};

export default function SeasonManagement() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [form, setForm] = useState<SeasonForm>(initialForm);
  const [editingSeason, setEditingSeason] =
    useState<Season | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSeasons() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/seasons");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudieron cargar las temporadas.",
        );
      }

      setSeasons(result.seasons ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las temporadas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadSeasons();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  function handleInputChange(
    field: keyof SeasonForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingSeason(null);
  }

  function startEditing(season: Season) {
    setEditingSeason(season);

    setForm({
      name: season.name,
      description: season.description ?? "",
      starts_at: season.starts_at
        ? season.starts_at.slice(0, 16)
        : "",
      ends_at: season.ends_at
        ? season.ends_at.slice(0, 16)
        : "",
    });

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("El nombre de la temporada es obligatorio.");
      return;
    }

    if (name.length > 120) {
      setError("El nombre de la temporada es demasiado largo.");
      return;
    }

    if (description.length > 500) {
      setError("La descripción es demasiado larga.");
      return;
    }

    if (form.starts_at && form.ends_at) {
      const startDate = new Date(form.starts_at);
      const endDate = new Date(form.ends_at);

      if (startDate >= endDate) {
        setError(
          "La fecha de inicio debe ser anterior a la fecha de finalización.",
        );
        return;
      }
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingSeason);

      const response = await fetch(
        isEditing
          ? `/api/admin/seasons/${editingSeason?.id}`
          : "/api/admin/seasons",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description || null,
            starts_at: form.starts_at
              ? new Date(form.starts_at).toISOString()
              : null,
            ends_at: form.ends_at
              ? new Date(form.ends_at).toISOString()
              : null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo guardar la temporada.",
        );
      }

      setSuccess(
        isEditing
          ? "Temporada actualizada correctamente."
          : "Temporada creada correctamente.",
      );

      resetForm();
      await loadSeasons();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la temporada.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSeason(season: Season) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/seasons/${season.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !season.is_active,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo cambiar el estado de la temporada.",
        );
      }

      setSuccess(
        season.is_active
          ? "Temporada desactivada correctamente."
          : "Temporada activada correctamente.",
      );

      await loadSeasons();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado de la temporada.",
      );
    }
  }

  function formatDate(value: string | null) {
    if (!value) {
      return "Sin fecha";
    }

    return new Date(value).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingSeason ? "Editar temporada" : "Nueva temporada"}</CardTitle>
          <p className="text-text-secondary">
            {editingSeason
              ? "Modifica los datos de la temporada seleccionada."
              : "Crea una temporada para organizar campañas y ocasiones especiales."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nombre">
              <Input
                value={form.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                maxLength={120}
                disabled={saving}
                placeholder="Ej. San Valentín"
              />
            </Field>

            <Field label="Descripción" optional>
              <Textarea
                value={form.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                maxLength={500}
                disabled={saving}
                rows={4}
                placeholder="Describe brevemente esta temporada."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha de inicio" optional>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) => handleInputChange("starts_at", event.target.value)}
                  disabled={saving}
                />
              </Field>

              <Field label="Fecha de finalización" optional>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) => handleInputChange("ends_at", event.target.value)}
                  disabled={saving}
                />
              </Field>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {success && <p className="text-sm text-leaf">{success}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={saving} loadingText="Guardando…">
                {editingSeason ? "Guardar cambios" : "Crear temporada"}
              </Button>

              {editingSeason && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 p-0">
        <div className="border-b border-border-decorative p-4">
          <h2 className="text-xl font-semibold text-text">Temporadas</h2>
          <p className="text-text-secondary">Administra las temporadas existentes y su estado.</p>
        </div>

        {loading ? (
          <p className="p-6 text-center text-text-secondary">Cargando temporadas...</p>
        ) : seasons.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">No hay temporadas registradas.</p>
        ) : (
          <div className="divide-y divide-border-decorative">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-text">{season.name}</h3>
                    <Badge variant={season.is_active ? "brand" : "outline"}>
                      {season.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  {season.description && (
                    <p className="mt-1 text-text-secondary">{season.description}</p>
                  )}

                  <p className="mt-2 text-[13px] text-text-secondary">
                    {formatDate(season.starts_at)} → {formatDate(season.ends_at)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEditing(season)}>
                    Editar
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => void toggleSeason(season)}>
                    {season.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}