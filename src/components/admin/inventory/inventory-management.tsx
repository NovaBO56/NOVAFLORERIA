
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  PackagePlus,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

type StockStatus = "agotado" | "bajo" | "normal";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  item_type: "flor" | "insumo" | "componente" | "producto";
  unit: string;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stock_status: StockStatus;
};

const TYPE_LABELS: Record<InventoryItem["item_type"], string> = {
  flor: "Flor",
  insumo: "Insumo",
  componente: "Componente",
  producto: "Producto",
};

const STATUS_LABELS: Record<StockStatus, string> = {
  normal: "Normal",
  bajo: "Stock bajo",
  agotado: "Agotado",
};

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | StockStatus>(
    "todos",
  );
  const [typeFilter, setTypeFilter] = useState<
    "todos" | InventoryItem["item_type"]
  >("todos");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/inventory/items", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ?? "No se pudo cargar el inventario.",
        );
      }

      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el inventario.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const low = items.filter((item) => item.stock_status === "bajo").length;
    const out = items.filter((item) => item.stock_status === "agotado").length;
    const active = items.filter((item) => item.is_active).length;

    return { total, low, out, active };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.sku?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "todos" || item.stock_status === statusFilter;

      const matchesType =
        typeFilter === "todos" || item.item_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, search, statusFilter, typeFilter]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Inventario"
        description="Controla existencias, entradas, ajustes y movimientos de los insumos de la florería."
        actions={
          <Button type="button">
            <Plus className="size-4" />
            Nuevo ítem
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de ítems"
          value={String(stats.total)}
          icon={<Boxes />}
        />

        <StatCard
          label="Stock bajo"
          value={String(stats.low)}
          icon={<AlertTriangle />}
        />

        <StatCard
          label="Agotados"
          value={String(stats.out)}
          icon={<XCircle />}
        />

        <StatCard
          label="Activos"
          value={String(stats.active)}
          icon={<PackagePlus />}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              aria-label="Buscar inventario"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "todos" | StockStatus,
              )
            }
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="normal">Normal</option>
            <option value="bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | "todos"
                  | InventoryItem["item_type"],
              )
            }
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            aria-label="Filtrar por tipo"
          >
            <option value="todos">Todos los tipos</option>
            <option value="flor">Flores</option>
            <option value="insumo">Insumos</option>
            <option value="componente">Componentes</option>
            <option value="producto">Productos</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center p-6">
            <p className="text-sm text-text-secondary">
              Cargando inventario...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>

            <Button
              type="button"
              variant="outline"
              onClick={() => void loadItems()}
            >
              Reintentar
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={
              items.length === 0
                ? "No hay ítems de inventario"
                : "Sin resultados"
            }
            description={
              items.length === 0
                ? "Todavía no existen ítems registrados en el inventario."
                : "No encontramos ítems que coincidan con los filtros actuales."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Ítem</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Mínimo</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Estado del ítem</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">
                        {item.name}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-text-secondary">
                      {item.sku || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {TYPE_LABELS[item.item_type]}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {Number(item.current_stock)} {item.unit}
                    </td>

                    <td className="px-5 py-4 text-text-secondary">
                      {Number(item.minimum_stock)} {item.unit}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          item.stock_status === "normal"
                            ? "brand"
                            : "outline"
                        }
                      >
                        {STATUS_LABELS[item.stock_status]}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={item.is_active ? "brand" : "outline"}
                      >
                        {item.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
