
  "use client";

  import { useCallback, useEffect, useState } from "react";
  import {
    Boxes,
    CircleCheck,
    ImageIcon,
    PackageCheck,
    X,
  } from "lucide-react";

  import { Button } from "@/components/ui/button";
  import { Card } from "@/components/ui/card";
  import {
    Modal,
    ModalContent,
    ModalDescription,
    ModalHeader,
    ModalTitle,
  } from "@/components/ui/modal";

  import ProductForm, {
    type Product,
  } from "./product-form";
  import ProductList from "./product-list";
  import ProductComponentManagement from "./product-component-management";
  import ProductImageManagement from "./product-image-management";
  import ProductInventoryManagement from "./product-inventory-management";

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

  type ProductTab =
    | "info"
    | "images"
    | "inventory"
    | "components";

  const PAGE_SIZE = 20;

  type ProductFilters = {
    search: string;
    categoryId: string;
    seasonId: string;
    status: "" | "active" | "inactive";
    availability: "" | "available" | "unavailable";
    soldOut: "" | "sold" | "not_sold";
    featured: "" | "featured" | "not_featured";
  };

  const initialFilters: ProductFilters = {
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

    const [editingProduct, setEditingProduct] =
      useState<Product | null>(null);

    const [activeTab, setActiveTab] =
      useState<ProductTab>("info");

    const [filters, setFilters] =
      useState<ProductFilters>(initialFilters);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const loadCatalogData = useCallback(async () => {
      try {
        const [
          categoriesResponse,
          seasonsResponse,
        ] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/seasons"),
        ]);

        const categoriesData =
          await categoriesResponse.json();

        const seasonsData =
          await seasonsResponse.json();

        if (
          !categoriesResponse.ok ||
          !categoriesData.success
        ) {
          throw new Error(
            categoriesData.message ||
              categoriesData.error ||
              "No se pudieron cargar las categorías.",
          );
        }

        if (
          !seasonsResponse.ok ||
          !seasonsData.success
        ) {
          throw new Error(
            seasonsData.message ||
              seasonsData.error ||
              "No se pudieron cargar las temporadas.",
          );
        }

        setCategories(categoriesData.categories ?? []);
        setSeasons(seasonsData.seasons ?? []);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los filtros.",
        );
      }
    }, []);

    const loadProducts = useCallback(async () => {
      try {
        setLoading(true);
        setMessage("");

        const params = new URLSearchParams();

        if (filters.search.trim()) {
          params.set(
            "search",
            filters.search.trim(),
          );
        }

        if (filters.categoryId) {
          params.set(
            "category_id",
            filters.categoryId,
          );
        }

        if (filters.seasonId) {
          params.set(
            "season_id",
            filters.seasonId,
          );
        }

        if (filters.status === "active") {
          params.set("is_active", "true");
        }

        if (filters.status === "inactive") {
          params.set("is_active", "false");
        }

        if (filters.availability === "available") {
          params.set("is_available", "true");
        }

        if (filters.availability === "unavailable") {
          params.set("is_available", "false");
        }

        if (filters.soldOut === "sold") {
          params.set("is_sold_out", "true");
        }

        if (filters.soldOut === "not_sold") {
          params.set("is_sold_out", "false");
        }

        if (filters.featured === "featured") {
          params.set("is_featured", "true");
        }

        if (filters.featured === "not_featured") {
          params.set("is_featured", "false");
        }

        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        const response = await fetch(
          `/api/admin/products?${params.toString()}`,
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              data.error ||
              "No se pudieron cargar los productos.",
          );
        }

        setProducts(data.products ?? []);
        setTotal(Number(data.total ?? 0));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar los productos.",
        );
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
      const timeoutId = window.setTimeout(() => {
        void loadProducts();
      }, 250);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }, [loadProducts]);

    function updateFilter<K extends keyof ProductFilters>(
      field: K,
      value: ProductFilters[K],
    ) {
      setPage(1);

      setFilters((current) => ({
        ...current,
        [field]: value,
      }));
    }

    function clearFilters() {
      setPage(1);
      setFilters(initialFilters);
    }

    function handleEdit(product: Product) {
      setEditingProduct(product);
      setActiveTab("info");
    }

    function handleCancelEdit() {
      setEditingProduct(null);
      setActiveTab("info");
    }

    async function handleProductSaved() {
      setEditingProduct(null);
      setActiveTab("info");
      await loadProducts();
    }

    async function toggleProduct(
      product: Product,
      field:
        | "is_active"
        | "is_available"
        | "is_sold_out"
        | "is_featured",
    ) {
      setMessage("");

      const newValue = !product[field];

      try {
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

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              data.error ||
              "No se pudo actualizar el producto.",
          );
        }

        await loadProducts();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al actualizar el producto.",
        );
      }
    }

    const totalPages = Math.max(
      1,
      Math.ceil(total / PAGE_SIZE),
    );

    const hasFilters =
      filters.search.trim() !== "" ||
      filters.categoryId !== "" ||
      filters.seasonId !== "" ||
      filters.status !== "" ||
      filters.availability !== "" ||
      filters.soldOut !== "" ||
      filters.featured !== "";

    return (
      <div className="flex flex-col gap-6">
        {message && (
          <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-text">
            <CircleCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand"
            />

            <p className="flex-1">{message}</p>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMessage("")}
              aria-label="Cerrar mensaje"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        )}

        <Card className="p-5">
          <ProductForm
            categories={categories}
            seasons={seasons}
            editingProduct={null}
            onSaved={handleProductSaved}
            onCancel={handleCancelEdit}
          />
        </Card>

        <Card className="gap-0 overflow-hidden p-0">
          <div className="border-b border-border-decorative p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-text">
                Gestión de productos
              </h2>

              <p className="text-sm text-text-secondary">
                Busca, filtra y administra los productos del
                catálogo.
              </p>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_repeat(3,minmax(150px,1fr))]">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-search"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Buscar
                </label>

                <input
                  id="product-search"
                  value={filters.search}
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value,
                    )
                  }
                  placeholder="Buscar por nombre..."
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none transition-colors focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-category-filter"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Categoría
                </label>

                <select
                  id="product-category-filter"
                  value={filters.categoryId}
                  onChange={(event) =>
                    updateFilter(
                      "categoryId",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <option value="">Todas</option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-season-filter"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Temporada
                </label>

                <select
                  id="product-season-filter"
                  value={filters.seasonId}
                  onChange={(event) =>
                    updateFilter(
                      "seasonId",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <option value="">Todas</option>

                  {seasons.map((season) => (
                    <option
                      key={season.id}
                      value={season.id}
                    >
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-status-filter"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Estado
                </label>

                <select
                  id="product-status-filter"
                  value={filters.status}
                  onChange={(event) =>
                    updateFilter(
                      "status",
                      event.target.value as ProductFilters["status"],
                    )
                  }
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <option value="">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-availability-filter"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Disponibilidad
                </label>

                <select
                  id="product-availability-filter"
                  value={filters.availability}
                  onChange={(event) =>
                    updateFilter(
                      "availability",
                      event.target.value as ProductFilters["availability"],
                    )
                  }
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <option value="">Todas</option>
                  <option value="available">
                    Disponibles
                  </option>
                  <option value="unavailable">
                    No disponibles
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-sold-filter"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Inventario
                </label>

                <select
                  id="product-sold-filter"
                  value={filters.soldOut}
                  onChange={(event) =>
                    updateFilter(
                      "soldOut",
                      event.target.value as ProductFilters["soldOut"],
                    )
                  }
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <option value="">Todos</option>
                  <option value="sold">Agotados</option>
                  <option value="not_sold">
                    No agotados
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-featured-filter"
                  className="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                  Destacado
                </label>

                <select
                  id="product-featured-filter"
                  value={filters.featured}
                  onChange={(event) =>
                    updateFilter(
                      "featured",
                      event.target.value as ProductFilters["featured"],
                    )
                  }
                  className="h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-sm text-text outline-none focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <option value="">Todos</option>
                  <option value="featured">
                    Destacados
                  </option>
                  <option value="not_featured">
                    No destacados
                  </option>
                </select>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>

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
            onToggle={toggleProduct}
          />
        </Card>

        <Modal
          open={Boolean(editingProduct)}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelEdit();
            }
          }}
        >
          <ModalContent
            className="md:max-w-5xl"
            voice="admin"
          >
            {editingProduct && (
              <>
                <ModalHeader>
                  <ModalTitle>
                    Editar producto
                  </ModalTitle>

                  <ModalDescription>
                    Administra la información, imágenes,
                    inventario y componentes de{" "}
                    <strong>
                      {editingProduct.name}
                    </strong>
                    .
                  </ModalDescription>
                </ModalHeader>

                <div className="border-b border-border-decorative">
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("info")
                      }
                      className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                        activeTab === "info"
                          ? "border-brand text-brand"
                          : "border-transparent text-text-secondary hover:text-text"
                      }`}
                    >
                      <CircleCheck className="size-4" />
                      Información
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("images")
                      }
                      className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                        activeTab === "images"
                          ? "border-brand text-brand"
                          : "border-transparent text-text-secondary hover:text-text"
                      }`}
                    >
                      <ImageIcon className="size-4" />
                      Imágenes
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("inventory")
                      }
                      className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                        activeTab === "inventory"
                          ? "border-brand text-brand"
                          : "border-transparent text-text-secondary hover:text-text"
                      }`}
                    >
                      <PackageCheck className="size-4" />
                      Inventario
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("components")
                      }
                      className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                        activeTab === "components"
                          ? "border-brand text-brand"
                          : "border-transparent text-text-secondary hover:text-text"
                      }`}
                    >
                      <Boxes className="size-4" />
                      Componentes
                    </button>
                  </div>
                </div>

                <div className="min-h-[320px]">
                  {activeTab === "info" && (
                    <ProductForm
                      categories={categories}
                      seasons={seasons}
                      editingProduct={editingProduct}
                      onSaved={handleProductSaved}
                      onCancel={handleCancelEdit}
                    />
                  )}

                  {activeTab === "images" && (
                    <ProductImageManagement
                      productId={editingProduct.id}
                      productName={editingProduct.name}
                    />
                  )}

                  {activeTab === "inventory" && (
                    <ProductInventoryManagement
                      productId={editingProduct.id}
                    />
                  )}

                  {activeTab === "components" && (
                    <ProductComponentManagement
                      productId={editingProduct.id}
                    />
                  )}
                </div>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  }
