"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  CircleCheck,
  ChevronDown,
  Gift,
  ImageIcon,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { PageHeader } from "@/components/ui/page-header";
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
import { ProductRecommendations } from "./product-recommendations";
import { GlobalProductRecommendations } from "./global-product-recommendations";
import { ProductPublication } from "./product-publication";

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

type ProductTab = "info" | "images" | "inventory" | "components" | "recommendations" | "review";

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

export default function ProductManagement({ canManageRecommendations = false }: { canManageRecommendations?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recommendationCount, setRecommendationCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [createMode, setCreateMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<ProductTab>("info");
  const [area, setArea] = useState<"products" | "complements">("products");
  const [globalDirty, setGlobalDirty] = useState(false);
  const [editorDirty, setEditorDirty] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<ProductTab[]>(["info"]);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const [listError, setListError] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const requestId = useRef(0);
  const dirtyHandlers = useMemo(() => Object.fromEntries(["info", "images", "inventory", "components", "recommendations"].map(key => [key, (value: boolean) => setEditorDirty(current => current[key] === value ? current : { ...current, [key]: value })])), []);
  const hasEditorDirty = Object.values(editorDirty).some(Boolean);
  useEffect(() => {
    if (!hasEditorDirty && !globalDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    const warnNavigation = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.pathname === window.location.pathname) return;
      if (!window.confirm("Hay cambios sin guardar. ¿Quieres salir de Gestión de productos y descartarlos?")) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener("click", warnNavigation, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", warnNavigation, true); };
  }, [hasEditorDirty, globalDirty]);
  function selectTab(tab: ProductTab) { setActiveTab(tab); setVisited(current => current.includes(tab) ? current : [...current, tab]); }

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

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    const request = ++requestId.current;
    setLoading(true); setListError("");

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

      const response = await fetch(`/api/admin/products?${params.toString()}`, { signal });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los productos.",
        );
      }

      if (signal?.aborted || request !== requestId.current) return;
      setProducts(result.products ?? []);
      setTotal(result.total ?? 0);
    } catch (error) {
      if (signal?.aborted || request !== requestId.current) return;
      setListError(error instanceof Error ? error.message : "No se pudieron cargar los productos.");
      setProducts([]);
      setTotal(0);
    } finally {
      if (!signal?.aborted && request === requestId.current) setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalogData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCatalogData]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void loadProducts(controller.signal); }, filters.search.trim() ? 300 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadProducts, filters.search]);

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
    setRecommendationCount(null); setEditorDirty({}); setVisited(["info"]); setNotice("");
    setCreateMode(false);
    setEditingProduct(product);
    setActiveTab("info");
  }

  function handleCreate() {
    setEditorDirty({}); setVisited(["info"]); setNotice("");
    setCreateMode(true);
    setEditingProduct(null);
    setActiveTab("info");
  }

  function handleCancelEdit() {
    if (hasEditorDirty && !window.confirm("Hay cambios sin guardar u operaciones pendientes. ¿Quieres cerrar el editor y descartar los cambios no guardados?")) return;
    setEditorDirty({}); setNotice("");
    setCreateMode(false);
    setEditingProduct(null);
    setActiveTab("info");
  }

  async function handleProductSaved(
    product: Product,
    wasEditing: boolean,
  ) {
    setEditingProduct(product);
    setCreateMode(!wasEditing);
    setEditorDirty(current => ({ ...current, info: false }));
    setNoticeTone("success");
    setNotice(wasEditing ? "Cambios guardados correctamente." : "Producto creado como borrador. Ahora puedes añadir fotografías y configurar lo que necesita para prepararse.");
    await loadProducts();
  }

  async function handleToggle(
    product: Product,
    field:
      | "is_active"
      | "is_available"
      | "is_sold_out"
      | "is_featured",
  ) {
    if (field !== "is_featured" && !window.confirm(`¿Cambiar el estado de venta de ${product.name}? No se modificarán pedidos existentes.`)) return;
    setNotice("");
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
          result.message || result.error || "No se pudo actualizar el producto.",
        );
      }

      await loadProducts();
      setNoticeTone("success");
      setNotice("Producto actualizado.");
    } catch (error) {
      setNoticeTone("error");
      setNotice(error instanceof Error ? error.message : "No se pudo actualizar el producto. Intenta nuevamente.");
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
      <PageHeader
        eyebrow="Catálogo"
        title="Productos y arreglos"
        description="Organiza el catálogo, prepara cada receta y controla qué productos pueden venderse."
        actions={area === "products" ? <Button type="button" onClick={handleCreate}><Plus aria-hidden="true" />Nuevo producto</Button> : undefined}
      />
      {canManageRecommendations && (
        <nav aria-label="Áreas de gestión de productos" className="admin-tabs">
          <button type="button" aria-pressed={area === "products"} onClick={() => { if (globalDirty && !window.confirm("Hay cambios globales sin guardar. ¿Quieres descartarlos?")) return; setGlobalDirty(false); setArea("products"); }}><Boxes aria-hidden="true" className="size-4" />Productos y arreglos</button>
          <button type="button" aria-pressed={area === "complements"} onClick={() => setArea("complements")}><Gift aria-hidden="true" className="size-4" />Complementos</button>
        </nav>
      )}
      {area === "complements" && canManageRecommendations ? <GlobalProductRecommendations categories={categories} onDirtyChange={setGlobalDirty} /> : <>
      {notice && <Notice tone={noticeTone}>{noticeTone === "error" ? friendlyErrorMessage(notice, "No pudimos actualizar el producto. Intenta nuevamente.") : notice}</Notice>}

      {/* LISTADO */}
      <Card className="gap-0 overflow-hidden p-0">
        <CardHeader className="border-b border-border-decorative px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Catálogo de productos</CardTitle>

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

        <div className="admin-filter-bar block space-y-3 p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary"><span>{hasFilters ? Object.values(filters).filter(Boolean).length + " filtros activos" : "Busca o filtra el catálogo"}</span>{hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>}</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /><Input
              aria-label="Buscar productos"
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
              placeholder="Buscar por nombre de producto..."
              className="pl-9"
            /></div>
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
        </div><Button className="min-h-11" variant="outline" aria-expanded={filtersOpen} aria-controls="advanced-product-filters" onClick={() => setFiltersOpen(open => !open)}><SlidersHorizontal aria-hidden="true" className="size-4" />Filtros avanzados<ChevronDown aria-hidden="true" className={`size-4 ${filtersOpen ? "rotate-180" : ""}`} /></Button>
        <div id="advanced-product-filters" hidden={!filtersOpen}><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
        </div></div>
        </div>
        <CardContent className="p-0">
          <div>
            {listError ? <div className="space-y-3 p-4"><Notice tone="error">{friendlyErrorMessage(listError, "No pudimos cargar el catálogo. Intenta nuevamente.")}</Notice><Button variant="outline" onClick={() => void loadProducts()}>Reintentar</Button></div> : <ProductList
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
              hasFilters={hasFilters} onClearFilters={clearFilters} onCreate={handleCreate}
            />}
          </div>
        </CardContent>
      </Card>

      </>}
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
          className="max-h-[94dvh] gap-0 overflow-hidden p-0 pb-0 md:max-w-5xl md:p-0 [&_[data-slot=modal-close]]:size-11"
          voice="admin"
        >
          <ModalHeader className="shrink-0 border-b border-border-decorative bg-bg-admin/70 px-5 py-5 pr-16 sm:px-6 sm:pr-16">
            <ModalTitle>
              {editingProduct ? "Gestionar producto" : "Nuevo producto"}
            </ModalTitle>

            <ModalDescription>
              {editingProduct
                ? `Administra la información, fotos, inventario y componentes de ${editingProduct.name}.`
                : "1. Guarda la información básica. 2. Añade fotos y configura Inventario o Componentes. 3. Revisa la disponibilidad para vender."}
            </ModalDescription>
          </ModalHeader>

          <label className="px-5 pt-4 text-sm font-medium md:hidden">Sección del editor<select value={activeTab} className="mt-1 min-h-11 w-full rounded-xl border border-border-field bg-surface px-3" onChange={event => selectTab(event.target.value as ProductTab)}>{([ ["info","1 · Información"], ["images","2 · Fotografías"], ["inventory","3 · Receta y materiales"], ["components","Productos incluidos"], ["recommendations","Complementos opcionales"], ["review","4 · Revisar y publicar"] ] as const).filter(([tab]) => tab !== "recommendations" || canManageRecommendations).map(([tab,label]) => <option key={tab} value={tab} disabled={tab !== "info" && !editingProduct}>{label}</option>)}</select></label>
          <nav aria-label="Secciones del producto" className="hidden shrink-0 grid-cols-3 gap-1 border-b border-border-decorative bg-bg-admin/50 px-4 py-3 md:grid xl:grid-cols-6">
            {([ ["info","Información",CircleCheck], ["images","Fotografías",ImageIcon], ["inventory","Receta y materiales",PackageCheck], ["components","Productos incluidos",Boxes], ["recommendations","Complementos opcionales",Gift], ["review","Revisar y publicar",CircleCheck] ] as const).filter(([tab]) => tab !== "recommendations" || canManageRecommendations).map(([tab,label,Icon]) => <button key={tab} type="button" disabled={tab !== "info" && !editingProduct} aria-current={activeTab === tab ? "page" : undefined} onClick={() => selectTab(tab)} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 ${activeTab === tab ? "bg-brand-soft text-brand ring-1 ring-brand" : "text-text-secondary hover:bg-bg-admin"}`}><Icon aria-hidden="true" className="size-4" /><span>{label}</span>{tab === "recommendations" && editingProduct && <span className="text-xs">{recommendationCount === null ? "…" : `${recommendationCount} de 4 personalizados`}</span>}</button>)}
          </nav>

          {/* CONTENIDO */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {notice && <div className="mb-4 space-y-3"><Notice tone={noticeTone}>{noticeTone === "error" ? friendlyErrorMessage(notice, "No pudimos actualizar el producto.") : notice}</Notice>{createMode && editingProduct && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => selectTab("images")}>Continuar con fotografías</Button><Button variant="outline" onClick={() => selectTab("inventory")}>Configurar receta</Button><Button variant="ghost" onClick={handleCancelEdit}>Guardar y salir</Button></div>}</div>}
            {canManageRecommendations && editingProduct && <div hidden={activeTab !== "recommendations"}><ProductRecommendations key={editingProduct.id} productId={editingProduct.id} onCountChange={setRecommendationCount} onDirtyChange={dirtyHandlers.recommendations}/></div>}
            <div hidden={activeTab !== "info"}>
              <ProductForm
                key={`${editingProduct?.id ?? "new"}:${formVersion}`}
                categories={categories}
                seasons={seasons}
                editingProduct={editingProduct}
                onSaved={handleProductSaved}
                onCancel={handleCancelEdit}
                onDirtyChange={dirtyHandlers.info}
              />
            </div>

            {visited.includes("images") && editingProduct && (
              <div hidden={activeTab !== "images"}>
              <ProductImageManagement
                productId={editingProduct.id}
                productName={editingProduct.name}
              onDirtyChange={dirtyHandlers.images}
              />
              </div>
            )}

            {visited.includes("inventory") && editingProduct && (
              <div hidden={activeTab !== "inventory"}>
              <ProductInventoryManagement
                productId={editingProduct.id}
              onDirtyChange={dirtyHandlers.inventory}
              />
              </div>
            )}

            {visited.includes("components") && editingProduct && (
              <div hidden={activeTab !== "components"}>
              <ProductComponentManagement
                productId={editingProduct.id}
              onDirtyChange={dirtyHandlers.components}
              />
              </div>
            )}
            {activeTab === "review" && editingProduct && <ProductPublication product={editingProduct} pendingChanges={hasEditorDirty} onPublished={product => { setEditingProduct(product); setFormVersion(value => value + 1); void loadProducts(); }} />}
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
