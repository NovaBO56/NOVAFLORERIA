"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
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
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>{editingSeason ? "Editar temporada" : "Nueva temporada"}</CardTitle>
          <p className="text-sm leading-6 text-text-secondary">
            {editingSeason
              ? "Modifica los datos de la temporada seleccionada."
              : "Crea una temporada para organizar campañas y ocasiones especiales."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nombre" required>
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

            {error && <p role="alert" className="admin-notice" data-tone="danger">{error}</p>}
            {success && <p role="status" className="admin-notice" data-tone="success">{success}</p>}

            <div className="admin-form-actions">
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

      <SectionCard title="Temporadas" description="Consulta sus datos y administra su disponibilidad." action={<Badge variant="outline">{seasons.length} registradas</Badge>} className="min-w-0">
        {loading ? <p role="status" className="py-10 text-center text-sm text-text-secondary">Cargando temporadas…</p> : seasons.length === 0 ? <EmptyState title="No hay temporadas registradas" description="Completa el formulario para crear la primera temporada." /> : <Table>
          <TableHeader><TableRow><TableHead>Temporada</TableHead><TableHead>Vigencia</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>{seasons.map(season => <TableRow key={season.id}>
            <TableCell><p className="font-semibold">{season.name}</p>{season.description && <p className="mt-1 max-w-sm whitespace-normal text-xs leading-5 text-text-secondary">{season.description}</p>}</TableCell>
            <TableCell className="text-xs text-text-secondary"><span className="block">Desde {formatDate(season.starts_at)}</span><span className="mt-1 block">Hasta {formatDate(season.ends_at)}</span></TableCell>
            <TableCell><Badge variant={season.is_active ? "brand" : "outline"}>{season.is_active ? "Activa" : "Inactiva"}</Badge></TableCell>
            <TableCell><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => startEditing(season)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => void toggleSeason(season)}>{season.is_active ? "Desactivar" : "Activar"}</Button></div></TableCell>
          </TableRow>)}</TableBody>
        </Table>}
      </SectionCard>
    </div>
  );
}