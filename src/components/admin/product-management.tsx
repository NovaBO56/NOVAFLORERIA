
"use client";

import { useEffect, useState } from "react";
import ProductImageManagement from "@/components/admin/product-image-management";
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

type Product = {
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

type ProductForm = {
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

const emptyForm: ProductForm = {
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

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [productsResponse, categoriesResponse, seasonsResponse] =
        await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/categories"),
          fetch("/api/admin/seasons"),
        ]);

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const seasonsData = await seasonsResponse.json();

      if (!productsResponse.ok || !productsData.success) {
        throw new Error(
          productsData.error || "No se pudieron cargar los productos.",
        );
      }

      if (!categoriesResponse.ok || !categoriesData.success) {
        throw new Error(
          categoriesData.error || "No se pudieron cargar las categorías.",
        );
      }

      if (!seasonsResponse.ok || !seasonsData.success) {
        throw new Error(
          seasonsData.error || "No se pudieron cargar las temporadas.",
        );
      }

      setProducts(productsData.products ?? []);
      setCategories(categoriesData.categories ?? []);
      setSeasons(seasonsData.seasons ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar los datos.",
      );
    } finally {
      setLoading(false);
    }
  }
useEffect(() => {
  const timeoutId = setTimeout(() => {
    void loadData();
  }, 0);

  return () => clearTimeout(timeoutId);
}, []);

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
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
    });

    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const price = Number(form.price);
    const catalogOrder = Number(form.catalogOrder);

    if (!form.name.trim()) {
      setMessage("El nombre del producto es obligatorio.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessage("El precio debe ser un número mayor o igual a 0.");
      return;
    }

    if (!Number.isInteger(catalogOrder) || catalogOrder < 0) {
      setMessage("El orden del catálogo debe ser un entero mayor o igual a 0.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        categoryId: form.categoryId || null,
        occasion: form.occasion.trim() || null,
        seasonId: form.seasonId || null,
        isFeatured: form.isFeatured,
        isAvailable: form.isAvailable,
        isSoldOut: form.isSoldOut,
        catalogOrder,
        isActive: form.isActive,
      };

      const response = await fetch(
        editingId
          ? `/api/admin/products/${editingId}`
          : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (editingId
              ? "No se pudo actualizar el producto."
              : "No se pudo crear el producto."),
        );
      }

      setMessage(
        editingId
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente.",
      );

      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(
    product: Product,
    field: "is_active" | "is_available" | "is_sold_out" | "is_featured",
  ) {
    setMessage("");

    const newValue = !product[field];

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: newValue,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar el producto.");
      }

      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al actualizar el producto.",
      );
    }
  }

  function categoryName(categoryId: string | null) {
    if (!categoryId) return "Sin categoría";

    return (
      categories.find((category) => category.id === categoryId)?.name ??
      "Sin categoría"
    );
  }

  function seasonName(seasonId: string | null) {
    if (!seasonId) return "Sin temporada";

    return (
      seasons.find((season) => season.id === seasonId)?.name ?? "Sin temporada"
    );
  }

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-md border p-4 text-sm">{message}</div>
      )}

      <form
        onSubmit={saveProduct}
        className="space-y-6 rounded-lg border p-6"
      >
        <div>
          <h2 className="text-xl font-semibold">
            {editingId ? "Editar producto" : "Nuevo producto"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Completa los datos principales del producto.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="product-name" className="text-sm font-medium">
              Nombre
            </label>

            <input
              id="product-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              maxLength={200}
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="Ej. Ramo de rosas rojas"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="product-price" className="text-sm font-medium">
              Precio
            </label>

            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="product-description"
              className="text-sm font-medium"
            >
              Descripción
            </label>

            <textarea
              id="product-description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              maxLength={2000}
              rows={4}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Describe el producto..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="product-category" className="text-sm font-medium">
              Categoría
            </label>

            <select
              id="product-category"
              value={form.categoryId}
              onChange={(event) =>
                updateField("categoryId", event.target.value)
              }
              className="w-full rounded-md border px-3 py-2"
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
          </div>

          <div className="space-y-2">
            <label htmlFor="product-season" className="text-sm font-medium">
              Temporada
            </label>

            <select
              id="product-season"
              value={form.seasonId}
              onChange={(event) => updateField("seasonId", event.target.value)}
              className="w-full rounded-md border px-3 py-2"
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
          </div>

          <div className="space-y-2">
            <label htmlFor="product-occasion" className="text-sm font-medium">
              Ocasión
            </label>

            <input
              id="product-occasion"
              value={form.occasion}
              onChange={(event) => updateField("occasion", event.target.value)}
              maxLength={120}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Ej. Aniversario"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="product-order"
              className="text-sm font-medium"
            >
              Orden del catálogo
            </label>

            <input
              id="product-order"
              type="number"
              min="0"
              step="1"
              value={form.catalogOrder}
              onChange={(event) =>
                updateField("catalogOrder", event.target.value)
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                updateField("isFeatured", event.target.checked)
              }
            />
            Producto destacado
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) =>
                updateField("isAvailable", event.target.checked)
              }
            />
            Disponible
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isSoldOut}
              onChange={(event) =>
                updateField("isSoldOut", event.target.checked)
              }
            />
            Agotado
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
            />
            Activo
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : editingId
                ? "Guardar cambios"
                : "Crear producto"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border px-4 py-2"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Productos registrados</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} producto{products.length === 1 ? "" : "s"}.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Todavía no hay productos registrados.
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="rounded-lg border p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {product.name}
                      </h3>

                      {!product.is_active && (
                        <span className="rounded-full border px-2 py-1 text-xs">
                          Inactivo
                        </span>
                      )}

                      {product.is_sold_out && (
                        <span className="rounded-full border px-2 py-1 text-xs">
                          Agotado
                        </span>
                      )}

                      {product.is_featured && (
                        <span className="rounded-full border px-2 py-1 text-xs">
                          Destacado
                        </span>
                      )}
                    </div>

                    <p className="font-medium">
                      Bs {Number(product.price).toFixed(2)}
                    </p>

                    {product.description && (
                      <p className="max-w-3xl text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        Categoría: {categoryName(product.category_id)}
                      </span>

                      <span>
                        Temporada: {seasonName(product.season_id)}
                      </span>

                      {product.occasion && (
                        <span>Ocasión: {product.occasion}</span>
                      )}

                      <span>Orden: {product.catalog_order}</span>

                      <span>
                        {product.is_available
                          ? "Disponible"
                          : "No disponible"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2 lg:max-w-sm lg:justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleProduct(product, "is_active")
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      {product.is_active ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleProduct(product, "is_available")
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      {product.is_available
                        ? "Marcar no disponible"
                        : "Marcar disponible"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleProduct(product, "is_sold_out")
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      {product.is_sold_out
                        ? "Quitar agotado"
                        : "Marcar agotado"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleProduct(product, "is_featured")
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      {product.is_featured
                        ? "Quitar destacado"
                        : "Destacar"}
                    </button>
                  </div>
                </div>
                <ProductImageManagement
  productId={product.id}
  productName={product.name}
/>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
