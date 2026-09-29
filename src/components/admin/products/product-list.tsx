"use client";

import {
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Star,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Product } from "./product-form";

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

type ProductListProps = {
  products: Product[];
  categories: Category[];
  seasons: Season[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (product: Product) => void;
  onToggle: (
    product: Product,
    field:
      | "is_active"
      | "is_available"
      | "is_sold_out"
      | "is_featured",
  ) => void;
};

function categoryName(
  categories: Category[],
  categoryId: string | null,
) {
  if (!categoryId) return "Sin categoría";

  return (
    categories.find(
      (category) => category.id === categoryId,
    )?.name ?? "Sin categoría"
  );
}

function seasonName(
  seasons: Season[],
  seasonId: string | null,
) {
  if (!seasonId) return "Sin temporada";

  return (
    seasons.find(
      (season) => season.id === seasonId,
    )?.name ?? "Sin temporada"
  );
}

export default function ProductList({
  products,
  categories,
  seasons,
  total,
  page,
  totalPages,
  loading,
  onPageChange,
  onEdit,
  onToggle,
}: ProductListProps) {
  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="h-64 animate-pulse rounded-xl bg-bg-admin" />
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <PackageCheck
          aria-hidden="true"
          className="mb-3 size-9 text-brand"
        />

        <h3 className="font-semibold text-text">
          No hay productos que coincidan
        </h3>

        <p className="mt-1 max-w-md text-sm text-text-secondary">
          Prueba cambiando la búsqueda o los filtros
          utilizados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-border-decorative bg-bg-admin text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Producto
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Categoría
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Temporada
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Precio
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Estado
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Disponibilidad
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border-decorative last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        {product.name}
                      </p>

                      {product.occasion && (
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {product.occasion}
                        </p>
                      )}
                    </div>

                    {product.is_featured && (
                      <Star
                        aria-label="Producto destacado"
                        className="mt-0.5 size-4 shrink-0 fill-current text-brand"
                      />
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-text-secondary">
                  {categoryName(
                    categories,
                    product.category_id,
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-text-secondary">
                  {seasonName(
                    seasons,
                    product.season_id,
                  )}
                </td>

                <td className="px-4 py-3 text-right font-medium tabular-nums text-text">
                  Bs {Number(product.price).toFixed(2)}
                </td>

                <td className="px-4 py-3">
                  {!product.is_active ? (
                    <Badge variant="outline">
                      <Ban aria-hidden="true" />
                      Inactivo
                    </Badge>
                  ) : product.is_sold_out ? (
                    <Badge variant="outline">
                      <TriangleAlert aria-hidden="true" />
                      Agotado
                    </Badge>
                  ) : (
                    <Badge variant="brand">
                      <CircleCheck aria-hidden="true" />
                      Activo
                    </Badge>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  {product.is_available ? (
                    <span className="text-leaf">
                      Disponible
                    </span>
                  ) : (
                    <span className="text-text-secondary">
                      No disponible
                    </span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <details className="relative">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-border-field bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-bg-admin [&::-webkit-details-marker]:hidden">
                        <MoreHorizontal
                          aria-hidden="true"
                          className="size-4"
                        />
                        Acciones
                        <ChevronDown
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      </summary>

                      <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border-field bg-surface p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-text hover:bg-bg-admin"
                        >
                          <Pencil
                            aria-hidden="true"
                            className="size-4"
                          />
                          Editar producto
                        </button>

                        <div className="my-1 border-t border-border-decorative" />

                        <button
                          type="button"
                          onClick={() =>
                            onToggle(product, "is_active")
                          }
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-text hover:bg-bg-admin"
                        >
                          {product.is_active
                            ? "Desactivar producto"
                            : "Activar producto"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onToggle(
                              product,
                              "is_available",
                            )
                          }
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-text hover:bg-bg-admin"
                        >
                          {product.is_available
                            ? "Marcar no disponible"
                            : "Marcar disponible"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onToggle(
                              product,
                              "is_sold_out",
                            )
                          }
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-text hover:bg-bg-admin"
                        >
                          {product.is_sold_out
                            ? "Quitar agotado"
                            : "Marcar agotado"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onToggle(
                              product,
                              "is_featured",
                            )
                          }
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-text hover:bg-bg-admin"
                        >
                          {product.is_featured
                            ? "Quitar destacado"
                            : "Marcar destacado"}
                        </button>
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-decorative px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          {total === 0
            ? "0 productos"
            : `Mostrando ${
                (page - 1) * 20 + 1
              }–${Math.min(
                page * 20,
                total,
              )} de ${total} productos`}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() =>
              onPageChange(Math.max(1, page - 1))
            }
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Button>

          <span className="min-w-20 text-center text-sm text-text">
            Página {page} de {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() =>
              onPageChange(
                Math.min(totalPages, page + 1),
              )
            }
          >
            Siguiente
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}