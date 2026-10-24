"use client";

import { SafeImage as Image } from "@/components/public/safe-image";
import { useRef, useState, type ReactNode } from "react";
import { Heart, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Modal, ModalContent, ModalTitle, ModalDescription } from "@/components/ui/modal";
import { formatMoney, isPurchasable, pickImage } from "@/lib/public/format";
import type { PublicCategory, PublicProduct } from "@/lib/public/types";
import { ProductPlaceholder } from "../product-placeholder";

export type CatalogState = {
  status: "loading" | "ready" | "error";
  items: PublicProduct[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
};

const chipBase =
  "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black transition";
const chipActive = "bg-[#873c58] text-white";
const chipIdle =
  "border border-[#e6d7d8] bg-white text-[#66596b] hover:border-[#873c58] hover:text-[#873c58]";

/* ============================================================
   TARJETA DE PRODUCTO
   ============================================================ */

function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onAdd,
  onOpenDetail,
}: {
  product: PublicProduct;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAdd: () => void;
  onOpenDetail: () => void;
}) {
  const image = pickImage(product);
  const purchasable = isPurchasable(product);

  return (
    <article className="nova-product-card public-product-card group min-w-0 [overflow-wrap:anywhere]">
      <div className="relative aspect-[1/1.08] overflow-hidden rounded-2xl bg-[#f5eeea]">
        <button
          type="button"
          onClick={onOpenDetail}
          className="absolute inset-0 block h-full w-full"
          aria-label={`Ver detalle de ${product.name}`}
        >
          {image ? (
            <Image
              src={image.public_url}
              alt={image.alt_text ?? product.name}
              fill
              sizes="(min-width: 1024px) 280px, (min-width: 768px) 33vw, 50vw"
              className={`object-contain motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02] ${
                purchasable ? "" : "opacity-60"
              }`}
            />
          ) : (
            <ProductPlaceholder/>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-xl border border-white/70 bg-white shadow-sm transition hover:text-[#873c58] ${
            isFavorite ? "text-[#873c58]" : "text-[#66596b]"
          }`}
          aria-label={
            isFavorite
              ? `Quitar ${product.name} de favoritos`
              : `Agregar ${product.name} a favoritos`
          }
        >
          <Heart
            size={16}
            strokeWidth={1.8}
            key={String(isFavorite)} className={isFavorite ? "nova-favorite fill-current text-[#a14370]" : "text-[#a14370]"}
          />
        </button>

        {!purchasable ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#392b38] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
            {product.is_sold_out ? "Agotado" : "No disponible"}
          </div>
        ) : null}

        {product.occasion ? (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 w-fit max-w-[calc(100%-1rem)] rounded-lg bg-white/95 px-2 py-1 text-[10px] font-semibold leading-4 text-[#645460] shadow-sm">
            {product.occasion}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-4 pt-4 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-black leading-5 text-[#392b38]">
              <button
                type="button"
                onClick={onOpenDetail}
                className="-my-0.5 inline-block max-w-full py-0.5 text-left hover:text-[#873c58]"
              >
                {product.name}
              </button>
            </h3>

            <p className="mt-2 text-sm font-black text-[#873c58]">
              {formatMoney(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={!purchasable}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#e6d7d8] text-[#873c58] transition hover:bg-[#f3e3e5] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label={
              purchasable
                ? `Agregar ${product.name} al carrito`
                : `${product.name} no está disponible`
            }
          >
            <ShoppingBag size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   SECCIÓN CATÁLOGO
   ============================================================ */

type CatalogSectionProps = {
  promotionsOnly: boolean;
  onSelectPromotions: () => void;
  promotionContent: ReactNode;
  onClearFilters: () => void;
  categories: PublicCategory[];
  categoriesLoading: boolean;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  searchTerm: string;
  onClearSearch: () => void;
  favoritesOnly: boolean;
  onShowAll: () => void;
  state: CatalogState;
  onRetry: () => void;
  onLoadMore: () => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onAdd: (product: PublicProduct) => void;
  onOpenDetail: (product: PublicProduct) => void;
};

export function CatalogSection({
  promotionsOnly,
  onSelectPromotions,
  promotionContent,
  onClearFilters,
  categories,
  categoriesLoading,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onClearSearch,
  favoritesOnly,
  onShowAll,
  state,
  onRetry,
  onLoadMore,
  favoriteIds,
  onToggleFavorite,
  onAdd,
  onOpenDetail,
}: CatalogSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const filtered = Boolean(searchTerm) || favoritesOnly;

  function choose(action: () => void) { action(); setFiltersOpen(false); }
  const filters = <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[#392b38]">Categorías</h3><button type="button" onClick={() => choose(onClearFilters)} className="min-h-11 rounded-lg px-2 text-xs font-bold text-[#873c58] underline underline-offset-4">Limpiar</button></div>
    <div role="group" aria-label="Categorías" className="space-y-1">
      <button type="button" onClick={() => choose(() => { onSelectCategory(null); onShowAll(); })} aria-pressed={!selectedCategory && !promotionsOnly && !favoritesOnly} className={`${chipBase} w-full rounded-xl text-left ${!selectedCategory && !promotionsOnly && !favoritesOnly ? chipActive : chipIdle}`}>Todos los productos</button>
      {categoriesLoading ? <p className="text-sm text-[#6b5965]" role="status">Cargando categorías…</p> : categories.map(category => <button key={category.id} type="button" onClick={() => choose(() => onSelectCategory(category.id))} aria-pressed={!promotionsOnly && selectedCategory === category.id} className={`${chipBase} w-full rounded-xl text-left [overflow-wrap:anywhere] ${!promotionsOnly && selectedCategory === category.id ? chipActive : chipIdle}`}>{category.name}</button>)}
    </div>
    <div className="border-t border-[#eadde6] pt-5"><button type="button" onClick={() => choose(onSelectPromotions)} aria-pressed={promotionsOnly} className={`${chipBase} w-full rounded-xl text-left ${promotionsOnly ? chipActive : chipIdle}`}>Promociones</button></div>
  </div>;

  return (
    <section
      id="catalogo"
      className="scroll-mt-28 bg-[#fff9f4] px-5 py-12 sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-[1380px]">
        <span id="catalogo-promociones" className="block scroll-mt-28" aria-hidden="true" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b5965]">
              Catálogo
            </p>

            <h2
              className={`mt-2 text-3xl font-semibold leading-tight tracking-tight text-[#392b38] sm:text-4xl`}
            >
              Elige tu detalle
            </h2>

            <p className="mt-3 max-w-[500px] text-sm leading-6 text-[#6b5965]">
              Encuentra flores y regalos para cada ocasión.
            </p>

            {filtered ? (
              <p className="mt-4 text-xs text-[#6b5965]" role="status">
                {favoritesOnly
                  ? "Mostrando tus favoritos."
                  : `Resultados para «${searchTerm}».`}{" "}
                <button
                  type="button"
                  onClick={favoritesOnly ? onShowAll : onClearSearch}
                  className="font-black text-[#873c58] underline underline-offset-2"
                >
                  {favoritesOnly ? "Ver todo el catálogo" : "Quitar búsqueda"}
                </button>
              </p>
            ) : null}
          </div>
        </div>

        <button ref={filterTrigger} type="button" onClick={() => setFiltersOpen(true)} className="mt-6 inline-flex min-h-12 max-w-full items-center gap-2 rounded-xl border border-[#d9bfc6] bg-white px-5 py-3 text-left text-sm font-bold text-[#873c58] lg:hidden" aria-haspopup="dialog"><SlidersHorizontal size={18} className="shrink-0" aria-hidden /><span className="min-w-0 [overflow-wrap:anywhere]">Filtros{promotionsOnly ? " · Promociones"  : selectedCategory ? ` · ${categories.find(entry => entry.id === selectedCategory)?.name || "Categoría"}` : ""}</span></button>
        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-10">
          <aside aria-label="Filtros del catálogo" className="hidden min-w-0 rounded-3xl border border-[#eadde6] bg-white p-5 lg:block">{filters}</aside>
          <div className="min-w-0">
          {promotionsOnly ? promotionContent : <>
          {state.status === "loading" ? (
            <div
              className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3 lg:gap-6"
              aria-busy="true"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="min-w-0">
                  <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#f5eeea]" />

                  <div className="space-y-3 pt-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#f5eeea]" />

                    <div className="h-4 w-1/3 animate-pulse rounded bg-[#f5eeea]" />
                  </div>
                </div>
              ))}
            </div>
          ) : state.status === "error" ? (
            <div
              role="alert"
              className="rounded-2xl border border-[#eadfe9] bg-white px-6 py-10 text-center"
            >
              <p className="text-sm font-bold text-[#55485b]">
                No pudimos cargar el catálogo.
              </p>

              <p className="mt-2 text-xs text-[#746877]">
                Intenta nuevamente en unos momentos.
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-5 rounded-xl bg-[#873c58] px-5 py-3 text-xs font-black text-white transition hover:bg-[#713048]"
              >
                Reintentar
              </button>
            </div>
          ) : state.items.length === 0 ? (
            <div className="rounded-2xl border border-[#eadfe9] bg-white px-6 py-10 text-center">
              <p className="text-sm font-bold text-[#55485b]">
                {favoritesOnly
                  ? "Todavía no tienes favoritos."
                  : searchTerm
                    ? "No encontramos productos con esa búsqueda."
                    : "No hay productos disponibles."}
              </p>

              {favoritesOnly ? (
                <p className="mt-2 text-xs text-[#746877]">
                  Toca el corazón de un producto para guardarlo aquí.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3 lg:gap-6">
                {state.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={() => onToggleFavorite(product.id)}
                    onAdd={() => onAdd(product)}
                    onOpenDetail={() => onOpenDetail(product)}
                  />
                ))}
              </div>

              {state.hasMore ? (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-xs text-[#6b5965]">
                    Mostrando {state.items.length} de {state.total} productos
                  </p>

                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={state.loadingMore}
                    className="inline-flex h-12 items-center rounded-xl border border-[#d9bfc6] bg-white px-6 text-sm font-bold text-[#645460] transition hover:border-[#873c58] hover:text-[#873c58] disabled:cursor-wait disabled:opacity-60"
                  >
                    {state.loadingMore ? "Cargando…" : "Ver más productos"}
                  </button>
                </div>
              ) : null}
            </>
          )}
          </>}
          </div>
        </div>
        <Modal open={filtersOpen} onOpenChange={setFiltersOpen}><ModalContent voice="public" onCloseAutoFocus={event => { event.preventDefault(); filterTrigger.current?.focus(); }}><ModalTitle>Filtros del catálogo</ModalTitle><ModalDescription>Elige una categoría o consulta las promociones vigentes.</ModalDescription>{filters}</ModalContent></Modal>
      </div>
    </section>
  );
}
