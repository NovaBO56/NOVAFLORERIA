
"use client";

import { useEffect, useState } from "react";

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

const initialForm: ProductForm = {
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

  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        productsResponse,
        categoriesResponse,
        seasonsResponse,
      ] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/seasons"),
      ]);

      const productsResult = await productsResponse.json();
      const categoriesResult = await categoriesResponse.json();
      const seasonsResult = await seasonsResponse.json();

      if (
        !productsResponse.ok ||
        !productsResult.success
      ) {
        throw new Error(
          productsResult.message ||
            productsResult.error ||
            "No se pudieron cargar los productos.",
        );
      }

      if (
        !categoriesResponse.ok ||
        !categoriesResult.success
      ) {
        throw new Error(
          categoriesResult.message ||
            categoriesResult.error ||
            "No se pudieron cargar las categorías.",
        );
      }

      if (
        !seasonsResponse.ok ||
        !seasonsResult.success
      ) {
        throw new Error(
          seasonsResult.message ||
            seasonsResult.error ||
            "No se pudieron cargar las temporadas.",
        );
      }

      setProducts(productsResult.products ?? []);
      setCategories(categoriesResult.categories ?? []);
      setSeasons(seasonsResult.seasons ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos.",
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

  function handleInputChange(
    field: keyof ProductForm,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingProduct(null);
    setError("");
    setSuccess("");
  }

  function startEditing(product: Product) {
    setEditingProduct(product);

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
    const occasion = form.occasion.trim();

    const price = Number(form.price);
    const catalogOrder = Number(form.catalogOrder);

    if (!name) {
      setError(
        "El nombre del producto es obligatorio.",
      );
      return;
    }

    if (name.length > 200) {
      setError(
        "El nombre del producto es demasiado largo.",
      );
      return;
    }

    if (description.length > 2000) {
      setError(
        "La descripción es demasiado larga.",
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError(
        "El precio debe ser un número mayor o igual a 0.",
      );
      return;
    }

    if (occasion.length > 120) {
      setError(
        "La ocasión es demasiado larga.",
      );
      return;
    }

    if (
      !Number.isInteger(catalogOrder) ||
      catalogOrder < 0
    ) {
      setError(
        "El orden del catálogo debe ser un entero mayor o igual a 0.",
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingProduct);

      const response = await fetch(
        isEditing
          ? `/api/admin/products/${editingProduct?.id}`
          : "/api/admin/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description || null,
            price,
            categoryId: form.categoryId || null,
            occasion: occasion || null,
            seasonId: form.seasonId || null,
            isFeatured: form.isFeatured,
            isAvailable: form.isAvailable,
            isSoldOut: form.isSoldOut,
            catalogOrder,
            isActive: form.isActive,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudo guardar el producto.",
        );
      }

      setSuccess(
        isEditing
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente.",
      );

      resetForm();
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(
    product: Product,
    field:
      | "is_active"
      | "is_available"
      | "is_sold_out"
      | "is_featured",
  ) {
    setError("");
    setSuccess("");

    try {
      const newValue = !product[field];

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: newValue,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudo cambiar el estado del producto.",
        );
      }

      const messages = {
        is_active: product.is_active
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente.",

        is_available: product.is_available
          ? "Producto marcado como no disponible."
          : "Producto marcado como disponible.",

        is_sold_out: product.is_sold_out
          ? "Producto marcado nuevamente como disponible."
          : "Producto marcado como agotado.",

        is_featured: product.is_featured
          ? "Producto quitado de destacados."
          : "Producto marcado como destacado.",
      };

      setSuccess(messages[field]);

      await loadData();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del producto.",
      );
    }
  }

  function getCategoryName(
    categoryId: string | null,
  ) {
    if (!categoryId) {
      return "Sin categoría";
    }

    return (
      categories.find(
        (category) => category.id === categoryId,
      )?.name ?? "Sin categoría"
    );
  }

  function getSeasonName(
    seasonId: string | null,
  ) {
    if (!seasonId) {
      return "Sin temporada";
    }

    return (
      seasons.find(
        (season) => season.id === seasonId,
      )?.name ?? "Sin temporada"
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            {editingProduct
              ? "Editar producto"
              : "Nuevo producto"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {editingProduct
              ? "Modifica los datos del producto seleccionado."
              : "Crea un producto para el catálogo."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="product-name"
                className="text-sm font-medium"
              >
                Nombre
              </label>

              <input
                id="product-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  handleInputChange(
                    "name",
                    event.target.value,
                  )
                }
                maxLength={200}
                disabled={saving}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Ej. Ramo de rosas rojas"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="product-price"
                className="text-sm font-medium"
              >
                Precio
              </label>

              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  handleInputChange(
                    "price",
                    event.target.value,
                  )
                }
                disabled={saving}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="space-y-2">
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
                handleInputChange(
                  "description",
                  event.target.value,
                )
              }
              maxLength={2000}
              disabled={saving}
              rows={4}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Describe brevemente el producto."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="product-category"
                className="text-sm font-medium"
              >
                Categoría
              </label>

              <select
                id="product-category"
                value={form.categoryId}
                onChange={(event) =>
                  handleInputChange(
                    "categoryId",
                    event.target.value,
                  )
                }
                disabled={saving}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value="">
                  Sin categoría
                </option>

                {categories
                  .filter(
                    (category) =>
                      category.is_active,
                  )
                  .map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="product-season"
                className="text-sm font-medium"
              >
                Temporada
              </label>

              <select
                id="product-season"
                value={form.seasonId}
                onChange={(event) =>
                  handleInputChange(
                    "seasonId",
                    event.target.value,
                  )
                }
                disabled={saving}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value="">
                  Sin temporada
                </option>

                {seasons
                  .filter(
                    (season) => season.is_active,
                  )
                  .map((season) => (
                    <option
                      key={season.id}
                      value={season.id}
                    >
                      {season.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="product-occasion"
                className="text-sm font-medium"
              >
                Ocasión
              </label>

              <input
                id="product-occasion"
                type="text"
                value={form.occasion}
                onChange={(event) =>
                  handleInputChange(
                    "occasion",
                    event.target.value,
                  )
                }
                maxLength={120}
                disabled={saving}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
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
                  handleInputChange(
                    "catalogOrder",
                    event.target.value,
                  )
                }
                disabled={saving}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  handleInputChange(
                    "isFeatured",
                    event.target.checked,
                  )
                }
                disabled={saving}
              />
              Producto destacado
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  handleInputChange(
                    "isAvailable",
                    event.target.checked,
                  )
                }
                disabled={saving}
              />
              Disponible
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isSoldOut}
                onChange={(event) =>
                  handleInputChange(
                    "isSoldOut",
                    event.target.checked,
                  )
                }
                disabled={saving}
              />
              Agotado
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  handleInputChange(
                    "isActive",
                    event.target.checked,
                  )
                }
                disabled={saving}
              />
              Activo
            </label>
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
                : editingProduct
                  ? "Guardar cambios"
                  : "Crear producto"}
            </button>

            {editingProduct && (
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
            Productos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Administra los productos existentes y su
            estado.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No hay productos registrados.
          </div>
        ) : (
          <div className="divide-y">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-medium">
                      {product.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.is_active
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                    {product.is_sold_out && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        Agotado
                      </span>
                    )}

                    {product.is_featured && (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                        Destacado
                      </span>
                    )}
                  </div>

                  <p className="mt-1 font-medium">
                    Bs{" "}
                    {Number(product.price).toFixed(2)}
                  </p>

                  {product.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      Categoría:{" "}
                      {getCategoryName(
                        product.category_id,
                      )}
                    </span>

                    <span>
                      Temporada:{" "}
                      {getSeasonName(
                        product.season_id,
                      )}
                    </span>

                    {product.occasion && (
                      <span>
                        Ocasión: {product.occasion}
                      </span>
                    )}

                    <span>
                      Orden: {product.catalog_order}
                    </span>

                    <span>
                      {product.is_available
                        ? "Disponible"
                        : "No disponible"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      startEditing(product)
                    }
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleProduct(
                        product,
                        "is_active",
                      )
                    }
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    {product.is_active
                      ? "Desactivar"
                      : "Activar"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleProduct(
                        product,
                        "is_available",
                      )
                    }
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    {product.is_available
                      ? "No disponible"
                      : "Disponible"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleProduct(
                        product,
                        "is_sold_out",
                      )
                    }
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    {product.is_sold_out
                      ? "Quitar agotado"
                      : "Marcar agotado"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleProduct(
                        product,
                        "is_featured",
                      )
                    }
                    className="rounded-md border px-3 py-2 text-sm font-medium"
                  >
                    {product.is_featured
                      ? "Quitar destacado"
                      : "Destacar"}
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
