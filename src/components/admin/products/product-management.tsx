"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  CircleCheck,
  ImageIcon,
  PackageCheck,
  Plus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";

import ProductForm, {
  type Product,
} from "@/components/admin/products/product-form";
import ProductList from "@/components/admin/products/product-list";
import ProductImageManagement from "@/components/admin/products/product-image-management";
import ProductInventoryManagement from "@/components/admin/products/product-inventory-management";
import ProductComponentManagement from "@/components/admin/products/product-component-management";

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

type ProductTab = "info" | "images" | "inventory" | "components";

type Filters = {
  search: string;
  categoryId: string;
  seasonId: string;
  status: string;
  availability: string;
  soldOut: string;
  featured: string;
};

const PAGE_SIZE = 20;

const initialFilters: Filters = {
  search: "",
  categoryId: "",
  seasonId: "",
  status: "",
  availability: "",
  soldOut: "",
  featured: "",
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [createMode, setCreateMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<ProductTab>("info");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadCatalogData = useCallback(async () => {
    setCatalogLoading(true);

    try {
      const [categoriesResponse, seasonsResponse] = await Promise.all([
        fetch("/api/admin/categories?limit=100"),
        fetch("/api/admin/seasons?limit=100"),
      ]);

      const categoriesResult = await categoriesResponse.json();
      const seasonsResult = await seasonsResponse.json();

      if (categoriesResponse.ok && categoriesResult.success) {
        setCategories(categoriesResult.categories ?? []);
      }

      if (seasonsResponse.ok && seasonsResult.success) {
        setSeasons(seasonsResult.seasons ?? []);
      }
    } catch (error) {
      console.error("Error cargando categorías y temporadas:", error);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
      }

      if (filters.categoryId) {
        params.set("category_id", filters.categoryId);
      }

      if (filters.seasonId) {
        params.set("season_id", filters.seasonId);
      }

      if (filters.status) {
        params.set("is_active", filters.status);
      }

      if (filters.availability) {
        params.set("is_available", filters.availability);
      }

      if (filters.soldOut) {
        params.set("is_sold_out", filters.soldOut);
      }

      if (filters.featured) {
        params.set("is_featured", filters.featured);
      }

      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los productos.",
        );
      }

      setProducts(result.products ?? []);
      setTotal(result.total ?? 0);
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalogData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCatalogData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  function updateFilter<K extends keyof Filters>(
    field: K,
    value: Filters[K],
  ) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));

    setPage(1);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  function handleEdit(product: Product) {
    setCreateMode(false);
    setEditingProduct(product);
    setActiveTab("info");
  }

  function handleCreate() {
    setCreateMode(true);
    setEditingProduct(null);
    setActiveTab("info");
  }

  function handleCancelEdit() {
    setCreateMode(false);
    setEditingProduct(null);
    setActiveTab("info");
  }

  async function handleProductSaved(
    product: Product,
    wasEditing: boolean,
  ) {
    await loadProducts();

    if (wasEditing) {
      setCreateMode(false);
      setEditingProduct(null);
      setActiveTab("info");
      return;
    }

    setEditingProduct(product);
    setCreateMode(true);
    setActiveTab("info");
  }

  async function handleToggle(
    product: Product,
    field:
      | "is_active"
      | "is_available"
      | "is_sold_out"
      | "is_featured",
  ) {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: !product[field],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo actualizar el producto.",
        );
      }

      await loadProducts();
    } catch (error) {
      console.error("Error actualizando producto:", error);
    }
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.categoryId) ||
    Boolean(filters.seasonId) ||
    Boolean(filters.status) ||
    Boolean(filters.availability) ||
    Boolean(filters.soldOut) ||
    Boolean(filters.featured);

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text">
            Gestión de productos
          </h2>

          <p className="text-sm text-text-secondary">
            Busca, filtra y administra los productos del catálogo.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleCreate}
          className="shrink-0"
        >
          <Plus aria-hidden="true" />
          Nuevo producto
        </Button>
      </div>

      {/* FILTROS */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Filtros</CardTitle>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              className="self-start sm:self-auto"
            >
              <X aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              aria-label="Buscar productos"
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
              placeholder="Buscar producto..."
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            />

            <select
              aria-label="Filtrar por categoría"
              value={filters.categoryId}
              onChange={(event) =>
                updateFilter("categoryId", event.target.value)
              }
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <option value="">Todas las categorías</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por temporada"
              value={filters.seasonId}
              onChange={(event) =>
                updateFilter("seasonId", event.target.value)
              }
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <option value="">Todas las temporadas</option>

              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por estado"
              value={filters.status}
              onChange={(event) =>
                updateFilter("status", event.target.value)
              }
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select
              aria-label="Filtrar por disponibilidad"
              value={filters.availability}
              onChange={(event) =>
                updateFilter("availability", event.target.value)
              }
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <option value="">Toda disponibilidad</option>
              <option value="true">Disponibles</option>
              <option value="false">No disponibles</option>
            </select>

            <select
              aria-label="Filtrar agotados"
              value={filters.soldOut}
              onChange={(event) =>
                updateFilter("soldOut", event.target.value)
              }
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <option value="">Agotado: todos</option>
              <option value="true">Agotados</option>
              <option value="false">No agotados</option>
            </select>

            <select
              aria-label="Filtrar destacados"
              value={filters.featured}
              onChange={(event) =>
                updateFilter("featured", event.target.value)
              }
              className="h-11 rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <option value="">Destacados: todos</option>
              <option value="true">Destacados</option>
              <option value="false">No destacados</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* LISTADO */}
      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Productos</CardTitle>

              <p className="mt-1 text-sm text-text-secondary">
                {loading
                  ? "Cargando productos..."
                  : `${total} producto${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}
              </p>
            </div>

            {catalogLoading && (
              <span className="text-xs text-text-secondary">
                Actualizando filtros...
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <ProductList
              products={products}
              categories={categories}
              seasons={seasons}
              total={total}
              page={page}
              totalPages={totalPages}
              loading={loading}
              onPageChange={setPage}
              onEdit={handleEdit}
              onToggle={handleToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE CREAR / EDITAR */}
      <Modal
        open={createMode || Boolean(editingProduct)}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          }
        }}
      >
        <ModalContent
          className="max-h-[92vh] overflow-hidden md:max-w-5xl"
          voice="admin"
        >
          <ModalHeader>
            <ModalTitle>
              {editingProduct ? "Gestionar producto" : "Nuevo producto"}
            </ModalTitle>

            <ModalDescription>
              {editingProduct
                ? `Administra la información, fotos, inventario y componentes de ${editingProduct.name}.`
                : "Primero registra la información básica. Después podrás agregar fotos, items de inventario y componentes."}
            </ModalDescription>
          </ModalHeader>

          {/* TABS */}
          <div className="border-b border-border-decorative">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-3 text-sm font-medium transition-colors ${
                  activeTab === "info"
                    ? "border-b-2 border-brand text-brand"
                    : "text-text-secondary hover:bg-bg-admin hover:text-text"
                }`}
              >
                <CircleCheck
                  aria-hidden="true"
                  className="size-4"
                />
                Información
              </button>

              <button
                type="button"
                disabled={!editingProduct}
                onClick={() => setActiveTab("images")}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeTab === "images"
                    ? "border-b-2 border-brand text-brand"
                    : "text-text-secondary hover:bg-bg-admin hover:text-text"
                }`}
              >
                <ImageIcon
                  aria-hidden="true"
                  className="size-4"
                />
                Fotos
              </button>

              <button
                type="button"
                disabled={!editingProduct}
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeTab === "inventory"
                    ? "border-b-2 border-brand text-brand"
                    : "text-text-secondary hover:bg-bg-admin hover:text-text"
                }`}
              >
                <PackageCheck
                  aria-hidden="true"
                  className="size-4"
                />
                Inventario
              </button>

              <button
                type="button"
                disabled={!editingProduct}
                onClick={() => setActiveTab("components")}
                className={`flex items-center justify-center gap-2 rounded-t-lg px-3 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeTab === "components"
                    ? "border-b-2 border-brand text-brand"
                    : "text-text-secondary hover:bg-bg-admin hover:text-text"
                }`}
              >
                <Boxes
                  aria-hidden="true"
                  className="size-4"
                />
                Componentes
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1">
            {activeTab === "info" && (
              <ProductForm
                categories={categories}
                seasons={seasons}
                editingProduct={editingProduct}
                onSaved={handleProductSaved}
                onCancel={handleCancelEdit}
              />
            )}

            {activeTab === "images" && editingProduct && (
              <ProductImageManagement
                productId={editingProduct.id}
                productName={editingProduct.name}
              />
            )}

            {activeTab === "inventory" && editingProduct && (
              <ProductInventoryManagement
                productId={editingProduct.id}
              />
            )}

            {activeTab === "components" && editingProduct && (
              <ProductComponentManagement
                productId={editingProduct.id}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}