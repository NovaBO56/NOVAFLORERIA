"use client";

import { DropdownMenu } from "radix-ui";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { primaryProductImage } from "@/lib/product-images";
import { ChevronLeft, ChevronRight, MoreHorizontal, PackageCheck, Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "./product-form";

type CatalogEntry = { id: string; name: string; is_active: boolean };
type ToggleField = "is_active" | "is_available" | "is_sold_out" | "is_featured";
type ProductListProps = {
  products: Product[]; categories: CatalogEntry[]; seasons: CatalogEntry[];
  total: number; page: number; totalPages: number; loading: boolean;
  onPageChange: (page: number) => void; onEdit: (product: Product) => void;
  onToggle: (product: Product, field: ToggleField) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
};
function nameOf(entries: CatalogEntry[], id: string | null, fallback: string) {
  return entries.find(entry => entry.id === id)?.name ?? fallback;
}
function ProductStatus({ product }: { product: Product }) {
  return <div className="flex flex-wrap gap-1.5">
    <Badge variant="outline" className={product.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-bg-admin text-text-secondary"}>{product.is_active ? "Publicado" : "Sin publicar"}</Badge>
    <span className="self-center text-xs text-text-secondary">{!product.is_available ? "Venta pausada" : product.is_sold_out || product.calculated_sold_out ? "Sin existencias / agotado" : product.calculated_available ? `Disponible · ${product.available_quantity}` : product.is_active ? "No disponible para venta" : "Venta pendiente de habilitar"}</span>
  </div>;
}
function ProductActions({ product, onEdit, onToggle }: Pick<ProductListProps, "onEdit" | "onToggle"> & { product: Product }) {
  const items: [ToggleField, string][] = [
    ["is_active", product.is_active ? "Desactivar" : "Activar"],
    ["is_available", product.is_available ? "No disponible" : "Disponible"],
    ["is_sold_out", product.is_sold_out ? "Quitar agotado" : "Marcar agotado"],
    ["is_featured", product.is_featured ? "Quitar destacado" : "Destacar"],
  ];
  const itemClass = "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none focus:bg-brand-soft focus:text-brand";
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild><Button variant="outline" className="min-h-11 shrink-0" aria-label={`Acciones para ${product.name}`}><MoreHorizontal aria-hidden="true" />Acciones</Button></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="theme-admin z-50 min-w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-border-decorative bg-surface p-1.5 text-text shadow-lg">
      <DropdownMenu.Item className={itemClass} onSelect={() => onEdit(product)}><Pencil aria-hidden="true" className="size-4" />Editar producto</DropdownMenu.Item>
      <DropdownMenu.Separator className="my-1 border-t border-border-decorative" />
      {items.map(([field, label]) => <DropdownMenu.Item key={field} className={itemClass} onSelect={() => onToggle(product, field)}>{label}</DropdownMenu.Item>)}
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
function Thumbnail({ product }: { product: Product }) {
  const photo = primaryProductImage(product.images);
  return <ProductThumbnail src={photo?.public_url} alt={photo?.alt_text || product.name} size="md" preview />;
}
export default function ProductList({ products, categories, seasons, total, page, totalPages, loading, onPageChange, onEdit, onToggle, hasFilters, onClearFilters, onCreate }: ProductListProps) {
  if (loading && products.length === 0) return <div role="status" className="p-6"><span className="sr-only">Cargando productos…</span><div className="h-64 animate-pulse rounded-xl bg-bg-admin" /></div>;
  if (!loading && products.length === 0) return <EmptyState
    icon={<PackageCheck aria-hidden="true" />}
    title={hasFilters ? "Sin productos para estos filtros" : "Todavía no tienes productos"}
    description={hasFilters ? "Prueba con otro nombre, categoría o estado." : "Crea el primer producto y configura sus fotos, receta y publicación."}
    action={<Button variant="outline" onClick={hasFilters ? onClearFilters : onCreate}>{hasFilters ? "Limpiar filtros" : "Crear primer producto"}</Button>}
  />;
  return <>
    <ul aria-label="Productos" className="divide-y divide-border-decorative lg:hidden">
      {products.map(product => <li key={product.id} className="space-y-3 p-4">
        <div className="flex items-start gap-3"><Thumbnail product={product} /><div className="min-w-0 flex-1"><p className="break-words font-semibold">{product.name}{product.is_featured && <Star aria-label="Producto destacado" className="ml-1 inline size-4 text-brand" />}</p><p className="mt-1 font-semibold tabular-nums">Bs {Number(product.price).toFixed(2)}</p></div></div>
        <p className="break-words text-sm text-text-secondary">{nameOf(categories, product.category_id, "Sin categoría")} · {nameOf(seasons, product.season_id, "Sin temporada")}{product.occasion ? ` · ${product.occasion}` : ""}</p>
        <div className="flex flex-wrap items-center justify-between gap-3"><ProductStatus product={product} /><ProductActions product={product} onEdit={onEdit} onToggle={onToggle} /></div>
      </li>)}
    </ul>
    <div className="product-admin-table hidden lg:block" role="region" aria-label="Productos y acciones" tabIndex={0}>
      <Table className="min-w-[860px]">
        <TableHeader><TableRow className="bg-bg-admin text-left">{["Producto", "Categoría", "Temporada", "Precio", "Estado y disponibilidad", "Acciones"].map(label => <TableHead key={label} numeric={label === "Precio"} className="px-4 py-3 font-semibold">{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{products.map(product => <TableRow key={product.id} className="border-b border-border-decorative">
          <TableCell className="px-4 py-3"><div className="flex items-start gap-3"><Thumbnail product={product} /><div className="min-w-0"><p className="max-w-64 break-words font-medium">{product.name}{product.is_featured && <Star aria-label="Producto destacado" className="ml-1 inline size-4 text-brand" />}</p>{product.occasion && <p className="mt-1 text-xs text-text-secondary">{product.occasion}</p>}</div></div></TableCell>
          <TableCell className="px-4 py-3 text-text-secondary">{nameOf(categories, product.category_id, "Sin categoría")}</TableCell>
          <TableCell className="px-4 py-3 text-text-secondary">{nameOf(seasons, product.season_id, "Sin temporada")}</TableCell>
          <TableCell numeric className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">Bs {Number(product.price).toFixed(2)}</TableCell>
          <TableCell className="px-4 py-3"><ProductStatus product={product} /></TableCell>
          <TableCell className="px-4 py-3"><ProductActions product={product} onEdit={onEdit} onToggle={onToggle} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <div className="flex flex-col gap-3 border-t border-border-decorative bg-bg-admin/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">{total === 0 ? "0 productos" : `Mostrando ${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} de ${total} productos`}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button className="min-h-11" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPageChange(Math.max(1, page - 1))}><ChevronLeft aria-hidden="true" />Anterior</Button>
        <span className="text-center text-xs">{page} de {totalPages}</span>
        <Button className="min-h-11" variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>Siguiente<ChevronRight aria-hidden="true" /></Button>
      </div>
    </div>
  </>;
}
