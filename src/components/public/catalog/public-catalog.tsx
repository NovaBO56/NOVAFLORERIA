"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CatalogFilters,
  type CatalogCategory,
  type CatalogSeason,
} from "./catalog-filters";
import { ProductGrid } from "./product-grid";
import type { PublicProduct } from "./product-card";

type ProductsResponse = {
  success: boolean;
  products: PublicProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message?: string;
};

type CategoriesResponse = {
  success: boolean;
  categories: CatalogCategory[];
  message?: string;
};

type SeasonsResponse = {
  success: boolean;
  seasons: CatalogSeason[];
  message?: string;
};

const PAGE_SIZE = 12;

export function PublicCatalog() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [seasons, setSeasons] = useState<CatalogSeason[]>([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [seasonId, setSeasonId] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState("");

  const loadFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);

      const [categoriesResponse, seasonsResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/seasons"),
      ]);

      const categoriesData =
        (await categoriesResponse.json()) as CategoriesResponse;

      const seasonsData = (await seasonsResponse.json()) as SeasonsResponse;

      if (!categoriesResponse.ok || !categoriesData.success) {
        throw new Error(
          categoriesData.message ?? "No se pudieron cargar las categorías.",
        );
      }

      if (!seasonsResponse.ok || !seasonsData.success) {
        throw new Error(
          seasonsData.message ?? "No se pudieron cargar las temporadas.",
        );
      }

      setCategories(categoriesData.categories ?? []);
      setSeasons(seasonsData.seasons ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los filtros.",
      );
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (categoryId) {
        params.set("category_id", categoryId);
      }

      if (seasonId) {
        params.set("season_id", seasonId);
      }

      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = (await response.json()) as ProductsResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ?? "No se pudo cargar el catálogo.",
        );
      }

      setProducts(data.products ?? []);
      setTotalPages(data.pagination?.total_pages ?? 1);
    } catch (err) {
      console.error(err);

      setProducts([]);
      setTotalPages(1);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el catálogo.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, seasonId, page]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setPage(1);
  }

  function handleSeasonChange(value: string) {
    setSeasonId(value);
    setPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setCategoryId("");
    setSeasonId("");
    setPage(1);
  }

  return (
    <section id="catalogo" className="bg-[#faf7fb] py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-[#9270a4]" />

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
              Nuestro catálogo
            </span>
          </div>

          <h2 className="text-3xl font-black text-[#403344] sm:text-4xl">
            Encuentra el detalle perfecto
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#756a79] sm:text-base">
            Explora nuestros arreglos florales y encuentra algo especial para
            cada momento.
          </p>
        </div>

        <CatalogFilters
          search={search}
          categoryId={categoryId}
          seasonId={seasonId}
          categories={categories}
          seasons={seasons}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSeasonChange={handleSeasonChange}
          onClear={handleClearFilters}
        />

        {loadingFilters && (
          <p className="mb-5 text-xs font-bold text-[#8a7d8e]">
            Cargando filtros...
          </p>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#e8e0ea] bg-white"
              >
                <div className="aspect-[4/5] animate-pulse bg-[#eee5f0]" />

                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#eee5f0]" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[#eee5f0]" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[#eee5f0]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <ProductGrid products={products} />

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl border border-[#d8c8de] bg-white px-4 py-2.5 text-xs font-black text-[#5f5263] transition hover:border-[#65358e] hover:text-[#65358e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <span className="px-3 text-xs font-bold text-[#756a79]">
                  Página {page} de {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl border border-[#d8c8de] bg-white px-4 py-2.5 text-xs font-black text-[#5f5263] transition hover:border-[#65358e] hover:text-[#65358e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}