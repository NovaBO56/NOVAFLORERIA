"use client";

import {
  Ban,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ImageIcon,
  PackageCheck,
  Pencil,
  Star,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import ProductComponentManagement from "./product-component-management";
import ProductImageManagement from "./product-image-management";
import ProductInventoryManagement from "./product-inventory-management";
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

type OpenDetail =
  | "images"
  | "components"
  | "inventory"
  | null;

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
  const [openDetails, setOpenDetails] = useState<
    Record<string, OpenDetail>
  >({});

  function toggleDetail(
    productId: string,
    detail: Exclude<OpenDetail, null>,
  ) {
    setOpenDetails((current) => ({
      ...current,
      [productId]:
        current[productId] === detail
          ? null
          : detail,
    }));
  }

  function isOpen(
    productId: string,
    detail: Exclude<OpenDetail, null>,
  ) {
    return openDetails[productId] === detail;
  }

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
            {products.map((product) => {
              const imagesOpen = isOpen(
                product.id,
                "images",
              );

              const componentsOpen = isOpen(
                product.id,
                "components",
              );

              const inventoryOpen = isOpen(
                product.id,
                "inventory",
              );

              const hasDetail =
                imagesOpen ||
                componentsOpen ||
                inventoryOpen;

              return (
                <tr
                  key={product.id}
                  className="border-b border-border-decorative last:border-b-0"
                >
                  <td
                    colSpan={7}
                    className="p-0"
                  >
                    <div className="flex min-w-[900px] items-center">
                      <div className="w-[23%] px-4 py-4">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-text">
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
                      </div>

                      <div className="w-[14%] px-4 py-4 text-sm text-text-secondary">
                        {categoryName(
                          categories,
                          product.category_id,
                        )}
                      </div>

                      <div className="w-[14%] px-4 py-4 text-sm text-text-secondary">
                        {seasonName(
                          seasons,
                          product.season_id,
                        )}
                      </div>

                      <div className="w-[11%] px-4 py-4 text-right font-medium tabular-nums text-text">
                        Bs{" "}
                        {Number(product.price).toFixed(
                          2,
                        )}
                      </div>

                      <div className="w-[13%] px-4 py-4">
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
                      </div>

                      <div className="w-[12%] px-4 py-4 text-sm">
                        {product.is_available ? (
                          <span className="text-leaf">
                            Disponible
                          </span>
                        ) : (
                          <span className="text-text-secondary">
                            No disponible
                          </span>
                        )}
                      </div>

                      <div className="flex w-[13%] justify-end px-4 py-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onEdit(product)
                          }
                        >
                          <Pencil aria-hidden="true" />
                          Editar
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-border-decorative bg-bg-admin px-4 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleDetail(
                              product.id,
                              "images",
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            imagesOpen
                              ? "bg-surface text-brand"
                              : "text-text-secondary hover:bg-surface hover:text-text"
                          }`}
                        >
                          <ImageIcon className="size-3.5" />
                          Imágenes
                          <ChevronDown
                            className={`size-3.5 transition-transform ${
                              imagesOpen
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleDetail(
                              product.id,
                              "components",
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            componentsOpen
                              ? "bg-surface text-brand"
                              : "text-text-secondary hover:bg-surface hover:text-text"
                          }`}
                        >
                          <Boxes className="size-3.5" />
                          Componentes
                          <ChevronDown
                            className={`size-3.5 transition-transform ${
                              componentsOpen
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleDetail(
                              product.id,
                              "inventory",
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            inventoryOpen
                              ? "bg-surface text-brand"
                              : "text-text-secondary hover:bg-surface hover:text-text"
                          }`}
                        >
                          <PackageCheck className="size-3.5" />
                          Inventario
                          <ChevronDown
                            className={`size-3.5 transition-transform ${
                              inventoryOpen
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        <span className="ml-auto text-xs text-text-secondary">
                          Orden: {product.catalog_order}
                        </span>
                      </div>
                    </div>

                    {hasDetail && (
                      <div className="border-t border-border-decorative bg-surface p-4">
                        {imagesOpen && (
                          <ProductImageManagement
                            productId={product.id}
                            productName={
                              product.name
                            }
                          />
                        )}

                        {componentsOpen && (
                          <ProductComponentManagement
                            productId={product.id}
                          />
                        )}

                        {inventoryOpen && (
                          <ProductInventoryManagement
                            productId={product.id}
                          />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
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
            disabled={
              page >= totalPages || loading
            }
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