
"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
};

type Season = {
  id: string;
  name: string;
  is_active: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  occasion: string | null;
  season_id: string | null;
  is_featured: boolean;
  is_available: boolean;
  is_sold_out: boolean;
  catalog_order: number;
  is_active: boolean;
};

export type ProductFormData = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  occasion: string;
  seasonId: string;
  isFeatured: boolean;
  isAvailable: boolean;
  isSoldOut: boolean;
  catalogOrder: string;
  isActive: boolean;
};

type ProductFormProps = {
  categories: Category[];
  seasons: Season[];
  editingProduct: Product | null;
  onSaved: (product: Product, wasEditing: boolean) => void;
  onCancel: () => void;
};

function getInitialForm(product: Product | null): ProductFormData {
  if (!product) {
    return {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      occasion: "",
      seasonId: "",
      isFeatured: false,
      isAvailable: true,
      isSoldOut: false,
      catalogOrder: "0",
      isActive: true,
    };
  }

  return {
    name: product.name,
    description: product.description ?? "",
    price: String(product.price),
    categoryId: product.category_id ?? "",
    occasion: product.occasion ?? "",
    seasonId: product.season_id ?? "",
    isFeatured: product.is_featured,
    isAvailable: product.is_available,
    isSoldOut: product.is_sold_out,
    catalogOrder: String(product.catalog_order),
    isActive: product.is_active,
  };
}

export default function ProductForm({
  categories,
  seasons,
  editingProduct,
  onSaved,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(() =>
    getInitialForm(editingProduct),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(editingProduct);

  function updateForm<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const name = form.name.trim();
    const description = form.description.trim();
    const occasion = form.occasion.trim();
    const price = Number(form.price);
    const catalogOrder = Number(form.catalogOrder);

    if (!name) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("El precio debe ser un número válido mayor o igual a cero.");
      return;
    }

    if (!Number.isInteger(catalogOrder) || catalogOrder < 0) {
      setError(
        "El orden del catálogo debe ser un número entero mayor o igual a cero.",
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        description: description || null,
        price,
        category_id: form.categoryId || null,
        occasion: occasion || null,
        season_id: form.seasonId || null,
        is_featured: form.isFeatured,
        is_available: form.isAvailable,
        is_sold_out: form.isSoldOut,
        catalog_order: catalogOrder,
        is_active: form.isActive,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const response = await fetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.product) {
        throw new Error(
          result.message ||
            `No se pudo ${editingProduct ? "actualizar" : "crear"} el producto.`,
        );
      }

      onSaved(result.product as Product, Boolean(editingProduct));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `No se pudo ${editingProduct ? "actualizar" : "crear"} el producto.`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold text-text">
          {isEditing ? "Editar producto" : "Nuevo producto"}
        </h3>

        <p className="mt-1 text-sm text-text-secondary">
          {isEditing
            ? "Actualiza la información del producto."
            : "Registra un nuevo producto en el catálogo."}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" required>
          <Input
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="Ej. OSO DE 25CM"
            disabled={saving}
          />
        </Field>

        <Field label="Precio" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => updateForm("price", event.target.value)}
            placeholder="0.00"
            disabled={saving}
          />
        </Field>

        <Field label="Categoría">
          <select
            value={form.categoryId}
            onChange={(event) => updateForm("categoryId", event.target.value)}
            disabled={saving}
            className="h-11 w-full rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Sin categoría</option>

            {categories
              .filter((category) => category.is_active)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Temporada">
          <select
            value={form.seasonId}
            onChange={(event) => updateForm("seasonId", event.target.value)}
            disabled={saving}
            className="h-11 w-full rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Sin temporada</option>

            {seasons
              .filter((season) => season.is_active)
              .map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Ocasión">
          <Input
            value={form.occasion}
            onChange={(event) => updateForm("occasion", event.target.value)}
            placeholder="Ej. Cumpleaños"
            disabled={saving}
          />
        </Field>

        <Field label="Orden del catálogo">
          <Input
            type="number"
            min="0"
            step="1"
            value={form.catalogOrder}
            onChange={(event) =>
              updateForm("catalogOrder", event.target.value)
            }
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Descripción">
        <Textarea
          value={form.description}
          onChange={(event) => updateForm("description", event.target.value)}
          placeholder="Descripción del producto..."
          rows={4}
          disabled={saving}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 rounded-xl border border-border-decorative bg-surface px-3 py-3 text-sm text-text">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) =>
              updateForm("isFeatured", event.target.checked)
            }
            disabled={saving}
            className="size-4 accent-brand"
          />
          Destacado
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-border-decorative bg-surface px-3 py-3 text-sm text-text">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(event) =>
              updateForm("isAvailable", event.target.checked)
            }
            disabled={saving}
            className="size-4 accent-brand"
          />
          Disponible
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-border-decorative bg-surface px-3 py-3 text-sm text-text">
          <input
            type="checkbox"
            checked={form.isSoldOut}
            onChange={(event) =>
              updateForm("isSoldOut", event.target.checked)
            }
            disabled={saving}
            className="size-4 accent-brand"
          />
          Agotado
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-border-decorative bg-surface px-3 py-3 text-sm text-text">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => updateForm("isActive", event.target.checked)}
            disabled={saving}
            className="size-4 accent-brand"
          />
          Activo
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border-decorative pt-4">
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            <X aria-hidden="true" />
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          loading={saving}
          loadingText={isEditing ? "Guardando…" : "Creando…"}
        >
          {isEditing ? (
            <Check aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}

          {isEditing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
