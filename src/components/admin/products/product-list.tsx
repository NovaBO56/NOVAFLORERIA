"use client";

import {
  Ban,
  Boxes,
  ChevronDown,
  CircleCheck,
  ImageIcon,
  PackageCheck,
  Pencil,
  Star,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

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

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  item_type: string;
  is_active: boolean;
};

type ProductListProps = {
  products: Product[];
  categories: Category[];
  seasons: Season[];
  inventoryItems: InventoryItem[];
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
    categories.find((category) => category.id === categoryId)?.name ??
    "Sin categoría"
  );
}

function seasonName(
  seasons: Season[],
  seasonId: string | null,
) {
  if (!seasonId) return "Sin temporada";

  return (
    seasons.find((season) => season.id === seasonId)?.name ??
    "Sin temporada"
  );
}

export default function ProductList({
  products,
  categories,
  seasons,
  inventoryItems,
  onEdit,
  onToggle,
}: ProductListProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand">
          Catálogo
        </p>

        <h2 className="text-xl font-semibold text-text">
          Productos registrados
        </h2>

        <p className="mt-1 text-sm text-text-secondary">
          {products.length} producto
          {products.length === 1 ? "" : "s"} registrado
          {products.length === 1 ? "" : "s"}.
        </p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <PackageCheck
              aria-hidden="true"
              className="mb-3 size-8 text-brand"
            />

            <h3 className="font-semibold text-text">
              Todavía no hay productos
            </h3>

            <p className="mt-1 text-sm text-text-secondary">
              Crea el primer producto utilizando el formulario de arriba.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden p-0 hover:shadow-card-hover"
            >
              {/* CABECERA */}
              <div className="flex flex-col gap-4 border-b border-border-decorative p-5 sm:p-6 lg:flex-row lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-text">
                      {product.name}
                    </h3>

                    {!product.is_active && (
                      <Badge variant="outline">
                        <Ban aria-hidden="true" />
                        Inactivo
                      </Badge>
                    )}

                    {product.is_sold_out && (
                      <Badge variant="outline">
                        <TriangleAlert aria-hidden="true" />
                        Agotado
                      </Badge>
                    )}

                    {product.is_featured && (
                      <Badge variant="brand">
                        <Star aria-hidden="true" />
                        Destacado
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <span className="text-lg font-semibold tabular-nums text-brand">
                      Bs {Number(product.price).toFixed(2)}
                    </span>

                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                      {product.is_available ? (
                        <CircleCheck
                          aria-hidden="true"
                          className="size-3.5 text-leaf"
                        />
                      ) : (
                        <Ban
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      )}

                      {product.is_available
                        ? "Disponible"
                        : "No disponible"}
                    </span>
                  </div>

                  {product.description && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-bg-admin px-2.5 py-1.5 text-xs text-text-secondary">
                      Categoría:{" "}
                      {categoryName(
                        categories,
                        product.category_id,
                      )}
                    </span>

                    <span className="rounded-lg bg-bg-admin px-2.5 py-1.5 text-xs text-text-secondary">
                      Temporada:{" "}
                      {seasonName(
                        seasons,
                        product.season_id,
                      )}
                    </span>

                    {product.occasion && (
                      <span className="rounded-lg bg-bg-admin px-2.5 py-1.5 text-xs text-text-secondary">
                        Ocasión: {product.occasion}
                      </span>
                    )}

                    <span className="rounded-lg bg-bg-admin px-2.5 py-1.5 text-xs text-text-secondary">
                      Orden: {product.catalog_order}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil aria-hidden="true" />
                    Editar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onToggle(product, "is_active")
                    }
                  >
                    {product.is_active
                      ? "Desactivar"
                      : "Activar"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onToggle(product, "is_available")
                    }
                  >
                    {product.is_available
                      ? "No disponible"
                      : "Disponible"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onToggle(product, "is_sold_out")
                    }
                  >
                    {product.is_sold_out
                      ? "Quitar agotado"
                      : "Marcar agotado"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onToggle(product, "is_featured")
                    }
                  >
                    <Star aria-hidden="true" />
                    {product.is_featured
                      ? "Quitar destacado"
                      : "Destacar"}
                  </Button>
                </div>
              </div>

              {/* DETALLES */}
              <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-3">
                {/* IMÁGENES */}
                <details className="group rounded-xl border border-border-decorative bg-bg-admin">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-brand">
                        <ImageIcon
                          aria-hidden="true"
                          className="size-4"
                        />
                      </span>

                      <span>
                        <span className="block text-sm font-medium text-text">
                          Imágenes
                        </span>

                        <span className="block text-xs text-text-secondary">
                          Fotografías del producto
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 text-text-secondary transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-border-decorative bg-surface p-4">
                    <ProductImageManagement
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </details>

                {/* COMPONENTES */}
                <details className="group rounded-xl border border-border-decorative bg-bg-admin">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-brand">
                        <Boxes
                          aria-hidden="true"
                          className="size-4"
                        />
                      </span>

                      <span>
                        <span className="block text-sm font-medium text-text">
                          Componentes
                        </span>

                        <span className="block text-xs text-text-secondary">
                          Productos que forman parte
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 text-text-secondary transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-border-decorative bg-surface p-4">
                    <ProductComponentManagement
                      productId={product.id}
                    />
                  </div>
                </details>

                {/* CONSUMO DE INVENTARIO */}
                <details className="group rounded-xl border border-border-decorative bg-bg-admin">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-brand">
                        <PackageCheck
                          aria-hidden="true"
                          className="size-4"
                        />
                      </span>

                      <span>
                        <span className="block text-sm font-medium text-text">
                          Consumo de inventario
                        </span>

                        <span className="block text-xs text-text-secondary">
                          Materiales utilizados por unidad
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 text-text-secondary transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-border-decorative bg-surface p-4">
                    <ProductInventoryManagement
                      productId={product.id}
                      inventoryItems={inventoryItems}
                    />
                  </div>
                </details>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}