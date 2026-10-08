"use client";

import { SafeImage as Image } from "@/components/public/safe-image";
import { Heart, ShoppingBag } from "lucide-react";
import { formatMoney, isPurchasable, pickImage } from "@/lib/public/format";
import type { PublicCategory, PublicProduct } from "@/lib/public/types";
import { script } from "./shared";

export type CatalogState = {
  status: "loading" | "ready" | "error";
  items: PublicProduct[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
};

const chipBase =
  "min-h-10 rounded-full px-4 py-2.5 text-xs font-black transition";
const chipActive = "bg-[#65358e] text-white";
const chipIdle =
  "border border-[#ded2e2] bg-white text-[#66596b] hover:border-[#65358e] hover:text-[#65358e]";

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
    <article className="nova-product-card group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#eee5f0]">
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
              className={`object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02] ${
                purchasable ? "" : "opacity-60"
              }`}
            />
          ) : (
            <span className="flex h-full items-center justify-center">
              <span className={`${script.className} text-5xl text-[#73547f]`}>
                Anabelle
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-xl border border-white/70 bg-white shadow-sm transition hover:text-[#65358e] ${
            isFavorite ? "text-[#65358e]" : "text-[#66596b]"
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
            className={isFavorite ? "fill-current" : ""}
          />
        </button>

        {!purchasable ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#28202d] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
            {product.is_sold_out ? "Agotado" : "No disponible"}
          </div>
        ) : null}

        {product.occasion ? (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6e6073] shadow-sm">
            {product.occasion}
          </div>
        ) : null}
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-black leading-5 text-[#403344]">
              <button
                type="button"
                onClick={onOpenDetail}
                className="-my-0.5 inline-block py-0.5 text-left hover:text-[#65358e]"
              >
                {product.name}
              </button>
            </h3>

            <p className="mt-2 text-sm font-black text-[#65358e]">
              {formatMoney(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={!purchasable}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#ded2e2] text-[#65358e] transition hover:bg-[#f3ebf6] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
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
  const filtered = Boolean(searchTerm) || favoritesOnly;

  return (
    <section
      id="catalogo"
      className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
              Catálogo
            </p>

            <h2
              className={`${script.className} mt-2 text-[52px] leading-none text-[#4c285f] sm:text-[64px]`}
            >
              Elige tu detalle
            </h2>

            <p className="mt-3 max-w-[500px] text-sm leading-6 text-[#736877]">
              Encuentra flores y regalos para cada ocasión.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory(null);
                  onShowAll();
                }}
                aria-pressed={selectedCategory === null && !favoritesOnly}
                className={`${chipBase} ${
                  selectedCategory === null && !favoritesOnly
                    ? chipActive
                    : chipIdle
                }`}
              >
                Todos
              </button>

              {categoriesLoading ? (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-9 w-20 animate-pulse rounded-full bg-[#eee5f0]"
                    />
                  ))}
                </>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    aria-pressed={selectedCategory === category.id}
                    className={`${chipBase} ${
                      selectedCategory === category.id ? chipActive : chipIdle
                    }`}
                  >
                    {category.name}
                  </button>
                ))
              )}
            </div>

            {filtered ? (
              <p className="mt-4 text-xs text-[#736877]" role="status">
                {favoritesOnly
                  ? "Mostrando tus favoritos."
                  : `Resultados para «${searchTerm}».`}{" "}
                <button
                  type="button"
                  onClick={favoritesOnly ? onShowAll : onClearSearch}
                  className="font-black text-[#65358e] underline underline-offset-2"
                >
                  {favoritesOnly ? "Ver todo el catálogo" : "Quitar búsqueda"}
                </button>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10">
          {state.status === "loading" ? (
            <div
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6"
              aria-busy="true"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="min-w-0">
                  <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#eee5f0]" />

                  <div className="space-y-3 pt-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#eee5f0]" />

                    <div className="h-4 w-1/3 animate-pulse rounded bg-[#eee5f0]" />
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
                className="mt-5 rounded-xl bg-[#65358e] px-5 py-3 text-xs font-black text-white transition hover:bg-[#572d7a]"
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
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
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
                  <p className="text-xs text-[#736877]">
                    Mostrando {state.items.length} de {state.total} productos
                  </p>

                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={state.loadingMore}
                    className="inline-flex h-12 items-center rounded-xl border border-[#d8c8de] bg-white px-6 text-sm font-bold text-[#55455c] transition hover:border-[#65358e] hover:text-[#65358e] disabled:cursor-wait disabled:opacity-60"
                  >
                    {state.loadingMore ? "Cargando…" : "Ver más productos"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
