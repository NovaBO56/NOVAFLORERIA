"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
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
    const controller = new AbortController();
    void fetch("/api/storefront-media", { signal: controller.signal })
      .then(response => response.json())
      .then(result => { if (!controller.signal.aborted && result.success) setCategoryImages(result.media?.categories ?? {}); })
      .catch(() => { /* Category data remains usable without optional covers. */ });
    const timeoutId = setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => { clearTimeout(timeoutId); controller.abort(); };
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
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>{editingCategory ? "Editar categoría" : "Nueva categoría"}</CardTitle>
          <p className="text-sm leading-6 text-text-secondary">
            {editingCategory
              ? "Modifica los datos de la categoría seleccionada."
              : "Crea una categoría para organizar los productos del catálogo."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-4 rounded-xl border border-border-decorative bg-bg-admin p-3">
              <ProductThumbnail src={editingCategory ? categoryImages[editingCategory.id] : null} alt={editingCategory?.name || form.name || "Portada de categoría"} kind="category" size="lg" preview />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">Portada de la categoría</p>
                <p className="mt-1 text-text-secondary">{editingCategory && categoryImages[editingCategory.id] ? "Esta fotografía aparece en la tienda." : "Todavía no tiene una portada configurada."}</p>
                {editingCategory ? <Link className="mt-2 inline-block font-medium text-brand underline underline-offset-4" href="/admin/configuracion#imagenes-de-la-tienda">Gestionar portadas en Configuración</Link> : <p className="mt-2 text-xs text-text-secondary">Guarda la categoría para configurar su portada.</p>}
              </div>
            </div>
            <Field label="Nombre" required>
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

            {error && <Notice tone="error" title="Revisa la categoría">{friendlyErrorMessage(error, "No pudimos guardar la categoría. Revisa los datos e intenta nuevamente.")}</Notice>}
            {success && <Notice tone="success">{success}</Notice>}

            <div className="admin-form-actions">
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

      <SectionCard title="Categorías" description="Consulta sus datos y administra su disponibilidad." action={<Badge variant="outline">{categories.length} registradas</Badge>} className="min-w-0">
        {loading ? <p role="status" className="py-10 text-center text-sm text-text-secondary">Cargando categorías…</p> : categories.length === 0 ? <EmptyState title="No hay categorías registradas" description="Completa el formulario para crear la primera categoría." /> : <Table>
          <TableHeader><TableRow><TableHead>Categoría</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>{categories.map(category => <TableRow key={category.id}>
            <TableCell><div className="flex items-start gap-3"><ProductThumbnail src={categoryImages[category.id]} alt={category.name} kind="category" size="md" preview /><div className="min-w-0"><p className="font-semibold">{category.name}</p><p className="mt-1 text-xs text-text-secondary">{categoryImages[category.id] ? "Con portada" : "Sin portada"}</p>{category.description && <p className="mt-1 max-w-sm whitespace-normal text-xs leading-5 text-text-secondary">{category.description}</p>}</div></div></TableCell>

            <TableCell><Badge variant={category.is_active ? "brand" : "outline"}>{category.is_active ? "Activa" : "Inactiva"}</Badge></TableCell>
            <TableCell><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => startEditing(category)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => void toggleCategory(category)}>{category.is_active ? "Desactivar" : "Activar"}</Button></div></TableCell>
          </TableRow>)}</TableBody>
        </Table>}
      </SectionCard>
    </div>
  );
}