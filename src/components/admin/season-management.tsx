
"use client";

import { useEffect, useState } from "react";

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
    <section className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            {editingSeason
              ? "Editar temporada"
              : "Nueva temporada"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingSeason
              ? "Modifica los datos de la temporada seleccionada."
              : "Crea una temporada para organizar campañas y ocasiones especiales."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="season-name"
              className="text-sm font-medium"
            >
              Nombre
            </label>

            <input
              id="season-name"
              type="text"
              value={form.name}
              onChange={(event) =>
                handleInputChange("name", event.target.value)
              }
              maxLength={120}
              disabled={saving}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Ej. San Valentín"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="season-description"
              className="text-sm font-medium"
            >
              Descripción
            </label>

            <textarea
              id="season-description"
              value={form.description}
              onChange={(event) =>
                handleInputChange(
                  "description",
                  event.target.value,
                )
              }
              maxLength={500}
              disabled={saving}
              rows={4}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Describe brevemente esta temporada."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="season-starts"
                className="text-sm font-medium"
              >
                Fecha de inicio
              </label>

              <input
                id="season-starts"
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) =>
                  handleInputChange(
                    "starts_at",
                    event.target.value,
                  )
                }
                disabled={saving}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="season-ends"
                className="text-sm font-medium"
              >
                Fecha de finalización
              </label>

              <input
                id="season-ends"
                type="datetime-local"
                value={form.ends_at}
                onChange={(event) =>
                  handleInputChange(
                    "ends_at",
                    event.target.value,
                  )
                }
                disabled={saving}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : editingSeason
                  ? "Guardar cambios"
                  : "Crear temporada"}
            </button>

            {editingSeason && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            Temporadas
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Administra las temporadas existentes y su estado.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Cargando temporadas...
          </div>
        ) : seasons.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No hay temporadas registradas.
          </div>
        ) : (
          <div className="divide-y">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">
                      {season.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        season.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {season.is_active
                        ? "Activa"
                        : "Inactiva"}
                    </span>
                  </div>

                  {season.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {season.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(season.starts_at)} →{" "}
                    {formatDate(season.ends_at)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(season)}
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleSeason(season)}
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    {season.is_active
                      ? "Desactivar"
                      : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
