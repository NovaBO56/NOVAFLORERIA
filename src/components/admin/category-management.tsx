"use client";

import { useEffect, useState } from "react";

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
<section className="space-y-6">
<div className="rounded-lg border bg-card p-6">
<div className="mb-5">
<h2 className="text-xl font-semibold">
{editingCategory
? "Editar categoría"
: "Nueva categoría"}
</h2>

      <p className="mt-1 text-sm text-muted-foreground">
        {editingCategory
          ? "Modifica los datos de la categoría seleccionada."
          : "Crea una categoría para organizar los productos del catálogo."}
      </p>
    </div>

    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="category-name"
          className="text-sm font-medium"
        >
          Nombre
        </label>

        <input
          id="category-name"
          type="text"
          value={form.name}
          onChange={(event) =>
            handleInputChange(
              "name",
              event.target.value,
            )
          }
          maxLength={120}
          disabled={saving}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
          placeholder="Ej. Ramos"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="category-description"
          className="text-sm font-medium"
        >
          Descripción
        </label>

        <textarea
          id="category-description"
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
          placeholder="Describe brevemente la categoría."
        />
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
            : editingCategory
              ? "Guardar cambios"
              : "Crear categoría"}
        </button>

        {editingCategory && (
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
        Categorías
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Administra las categorías existentes y su estado.
      </p>
    </div>

    {loading ? (
      <div className="px-6 py-8 text-center text-sm text-muted-foreground">
        Cargando categorías...
      </div>
    ) : categories.length === 0 ? (
      <div className="px-6 py-8 text-center text-sm text-muted-foreground">
        No hay categorías registradas.
      </div>
    ) : (
      <div className="divide-y">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-medium">
                  {category.name}
                </h3>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    category.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {category.is_active
                    ? "Activa"
                    : "Inactiva"}
                </span>
              </div>

              {category.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() =>
                  startEditing(category)
                }
                className="rounded-md border px-3 py-2 text-sm font-medium"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleCategory(category)
                }
                className="rounded-md border px-3 py-2 text-sm font-medium"
              >
                {category.is_active
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