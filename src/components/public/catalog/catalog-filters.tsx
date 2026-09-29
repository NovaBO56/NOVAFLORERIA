"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

export type CatalogCategory = {
  id: string;
  name: string;
};

export type CatalogSeason = {
  id: string;
  name: string;
};

type CatalogFiltersProps = {
  search: string;
  categoryId: string;
  seasonId: string;
  categories: CatalogCategory[];
  seasons: CatalogSeason[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSeasonChange: (value: string) => void;
  onClear: () => void;
};

export function CatalogFilters({
  search,
  categoryId,
  seasonId,
  categories,
  seasons,
  onSearchChange,
  onCategoryChange,
  onSeasonChange,
  onClear,
}: CatalogFiltersProps) {
  const hasFilters = Boolean(search || categoryId || seasonId);

  return (
    <div className="mb-8 rounded-2xl border border-[#e8e0ea] bg-white p-4 shadow-[0_8px_25px_rgba(65,39,75,.05)] sm:p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#f3ebf6] text-[#65358e]">
          <SlidersHorizontal size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#403344]">
            Encuentra tu arreglo
          </p>

          <p className="text-xs text-[#8a7d8e]">
            Busca y filtra nuestro catálogo.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>

          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98899d]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar arreglos..."
            className="h-11 w-full rounded-xl border border-[#ded2e2] bg-[#fcfafc] pl-11 pr-4 text-sm text-[#403344] outline-none transition placeholder:text-[#a497aa] focus:border-[#65358e] focus:ring-2 focus:ring-[#65358e]/10"
          />
        </label>

        <label>
          <span className="sr-only">Categoría</span>

          <select
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#ded2e2] bg-[#fcfafc] px-4 text-sm text-[#403344] outline-none transition focus:border-[#65358e] focus:ring-2 focus:ring-[#65358e]/10"
          >
            <option value="">Todas las categorías</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Temporada</span>

          <select
            value={seasonId}
            onChange={(event) => onSeasonChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#ded2e2] bg-[#fcfafc] px-4 text-sm text-[#403344] outline-none transition focus:border-[#65358e] focus:ring-2 focus:ring-[#65358e]/10"
          >
            <option value="">Todas las temporadas</option>

            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8c8de] bg-white px-4 text-xs font-black text-[#6e6372] transition hover:border-[#65358e] hover:text-[#65358e]"
          >
            <X size={15} />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}