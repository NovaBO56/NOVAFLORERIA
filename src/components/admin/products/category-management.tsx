"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";

type Category = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CategoryForm = {
  name: string;
  description: string;
};

const initialForm: CategoryForm = {
  name: "",
  description: "",
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/categories");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudieron cargar las categorías.",
        );
      }

      setCategories(result.categories ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las categorías.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  function handleInputChange(
    field: keyof CategoryForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingCategory(null);
    setError("");
    setSuccess("");
  }

  function startEditing(category: Category) {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description: category.description ?? "",
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
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    if (name.length > 120) {
      setError(
        "El nombre de la categoría es demasiado largo.",
      );
      return;
    }

    if (description.length > 500) {
      setError(
        "La descripción de la categoría es demasiado larga.",
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingCategory);

      const response = await fetch(
        isEditing
          ? `/api/admin/categories/${editingCategory?.id}`
          : "/api/admin/categories",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description || null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudo guardar la categoría.",
        );
      }

      setSuccess(
        isEditing
          ? "Categoría actualizada correctamente."
          : "Categoría creada correctamente.",
      );

      setForm(initialForm);
      setEditingCategory(null);

      await loadCategories();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la categoría.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(category: Category) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !category.is_active,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudo cambiar el estado de la categoría.",
        );
      }

      setSuccess(
        category.is_active
          ? "Categoría desactivada correctamente."
          : "Categoría activada correctamente.",
      );

      await loadCategories();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado de la categoría.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingCategory ? "Editar categoría" : "Nueva categoría"}</CardTitle>
          <p className="text-text-secondary">
            {editingCategory
              ? "Modifica los datos de la categoría seleccionada."
              : "Crea una categoría para organizar los productos del catálogo."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Nombre">
              <Input
                value={form.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                maxLength={120}
                disabled={saving}
                required
                placeholder="Ej. Ramos"
              />
            </Field>

            <Field label="Descripción" optional>
              <Textarea
                value={form.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                maxLength={500}
                disabled={saving}
                rows={4}
                placeholder="Describe brevemente la categoría."
              />
            </Field>

            {error && <p className="text-sm text-danger">{error}</p>}
            {success && <p className="text-sm text-leaf">{success}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={saving} loadingText="Guardando…">
                {editingCategory ? "Guardar cambios" : "Crear categoría"}
              </Button>

              {editingCategory && (
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
          <h2 className="text-xl font-semibold text-text">Categorías</h2>
          <p className="text-text-secondary">Administra las categorías existentes y su estado.</p>
        </div>

        {loading ? (
          <p className="p-6 text-center text-text-secondary">Cargando categorías...</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">No hay categorías registradas.</p>
        ) : (
          <div className="divide-y divide-border-decorative">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-medium text-text">{category.name}</h3>
                    <Badge variant={category.is_active ? "brand" : "outline"}>
                      {category.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  {category.description && (
                    <p className="mt-1 text-text-secondary">{category.description}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                  <Button size="sm" variant="outline" onClick={() => startEditing(category)}>
                    Editar
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => void toggleCategory(category)}>
                    {category.is_active ? "Desactivar" : "Activar"}
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