
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  History,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StockStatus = "agotado" | "bajo" | "normal";

type ItemType = "flor" | "insumo" | "componente" | "producto";

type MovementType =
  | "entrada"
  | "salida"
  | "merma"
  | "ajuste"
  | "devolucion"
  | "reversion";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  item_type: ItemType;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stock_status: StockStatus;
};

type Lot = {
  id: string;
  inventory_entry_id: string;
  inventory_item_id: string;
  initial_quantity: number;
  remaining_quantity: number;
  received_at: string;
  created_at: string;
  inventory_item?: {
    name: string;
    unit: string;
    item_type?: ItemType;
  } | null;
  entry?: {
    supplier_name: string | null;
  } | null;
  inventory_entry?: {
    supplier_name: string | null;
  } | null;
  fifo_next?: boolean;
};

type Movement = {
  id: string;
  inventory_item_id: string;
  lot_id: string | null;
  movement_type: MovementType;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  inventory_item?: {
    name: string;
    unit: string;
  } | null;
};

const TYPE_LABELS: Record<ItemType, string> = {
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

const MOVEMENT_LABELS: Record<MovementType, string> = {
  entrada: "Entrada",
  salida: "Salida",
  merma: "Merma",
  ajuste: "Ajuste",
  devolucion: "Devolución",
  reversion: "Reversión",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 3,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusVariant(status: StockStatus) {
  return status === "normal" ? "brand" : "outline";
}

function movementVariant(type: MovementType) {
  return type === "entrada" || type === "devolucion"
    ? "brand"
    : "outline";
}

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ?? "No se pudo completar la operación.",
    );
  }

  return data;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [movementTotal, setMovementTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lotsLoading, setLotsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [tab, setTab] = useState<"items" | "movements" | "lots">(
    "items",
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"todos" | StockStatus>("todos");
  const [typeFilter, setTypeFilter] =
    useState<"todos" | ItemType>("todos");

  const [movementFilter, setMovementFilter] =
    useState<"todos" | MovementType>("todos");

  const [movementPage, setMovementPage] = useState(0);

  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] =
    useState<InventoryItem | null>(null);

  const [entryModal, setEntryModal] = useState(false);
  const [wasteModal, setWasteModal] = useState(false);
  const [adjustmentModal, setAdjustmentModal] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: "",
    sku: "",
    item_type: "flor" as ItemType,
    unit: "unidad",
    minimum_stock: "0",
    is_active: true,
  });

  const [entryForm, setEntryForm] = useState({
    inventory_item_id: "",
    quantity: "",
    unit_cost: "",
    supplier_name: "",
    notes: "",
  });

  const [wasteForm, setWasteForm] = useState({
    inventory_item_id: "",
    lot_id: "",
    quantity: "",
    reason: "",
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    inventory_item_id: "",
    quantity_delta: "",
    reason: "",
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/admin/inventory/items",
        {
          cache: "no-store",
        },
      );

      const data = await readResponse(response);

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

  const loadMovements = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: "10",
        offset: String(movementPage * 10),
      });

      if (movementFilter !== "todos") {
        params.set("movement_type", movementFilter);
      }

      const response = await fetch(
        `/api/admin/inventory/movements?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await readResponse(response);

      setMovements(data.movements ?? []);
      setMovementTotal(data.total ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [movementFilter, movementPage]);

  const loadLots = useCallback(async () => {
    try {
      setLotsLoading(true);
      setError(null);

      const response = await fetch(
        "/api/admin/inventory/lots?only_available=true",
        {
          cache: "no-store",
        },
      );

      const data = await readResponse(response);

      setLots(data.lots ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los lotes.",
      );
    } finally {
      setLotsLoading(false);
    }
  }, []);

 useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadItems();
  }, 0);

  return () => window.clearTimeout(timer);
}, [loadItems]);
useEffect(() => {
  const timer = window.setTimeout(() => {
    if (tab === "movements") {
      void loadMovements();
    }

    if (tab === "lots") {
      void loadLots();
    }
  }, 0);

  return () => window.clearTimeout(timer);
}, [tab, loadMovements, loadLots]);

  const stats = useMemo(
    () => ({
      total: items.length,
      low: items.filter(
        (item) => item.stock_status === "bajo",
      ).length,
      out: items.filter(
        (item) => item.stock_status === "agotado",
      ).length,
      active: items.filter(
        (item) => item.is_active,
      ).length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "todos" ||
        item.stock_status === statusFilter;

      const matchesType =
        typeFilter === "todos" ||
        item.item_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [items, search, statusFilter, typeFilter]);

  const availableItems = useMemo(
    () => items.filter((item) => item.is_active),
    [items],
  );

  const movementPages = Math.max(
    1,
    Math.ceil(movementTotal / 10),
  );

  function openNewItem() {
    setEditingItem(null);

    setItemForm({
      name: "",
      sku: "",
      item_type: "flor",
      unit: "unidad",
      minimum_stock: "0",
      is_active: true,
    });

    setItemModal(true);
  }

  function openEditItem(item: InventoryItem) {
    setEditingItem(item);

    setItemForm({
      name: item.name,
      sku: item.sku ?? "",
      item_type: item.item_type,
      unit: item.unit,
      minimum_stock: String(
        item.minimum_stock,
      ),
      is_active: item.is_active,
    });

    setItemModal(true);
  }

  function openEntry() {
    setEntryForm({
      inventory_item_id:
        availableItems[0]?.id ?? "",
      quantity: "",
      unit_cost: "",
      supplier_name: "",
      notes: "",
    });

    setEntryModal(true);
  }

  function openWaste() {
    setWasteForm({
      inventory_item_id:
        availableItems[0]?.id ?? "",
      lot_id: "",
      quantity: "",
      reason: "",
    });

    setWasteModal(true);
    void loadLots();
  }

  function openAdjustment() {
    setAdjustmentForm({
      inventory_item_id:
        availableItems[0]?.id ?? "",
      quantity_delta: "",
      reason: "",
    });

    setAdjustmentModal(true);
  }

  async function saveItem(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const url = editingItem
        ? `/api/admin/inventory/items/${editingItem.id}`
        : "/api/admin/inventory/items";

      const method = editingItem
        ? "PATCH"
        : "POST";

      await readResponse(
        await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: itemForm.name.trim(),
            sku: itemForm.sku.trim() || null,
            item_type: itemForm.item_type,
            unit: itemForm.unit.trim(),
            minimum_stock: Number(
              itemForm.minimum_stock,
            ),
            ...(editingItem
              ? {
                  is_active:
                    itemForm.is_active,
                }
              : {}),
          }),
        }),
      );

      setItemModal(false);

      setNotice(
        editingItem
          ? "Ítem actualizado correctamente."
          : "Ítem creado correctamente.",
      );

      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el ítem.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveEntry(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await readResponse(
        await fetch(
          "/api/admin/inventory/entries",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inventory_item_id:
                entryForm.inventory_item_id,
              quantity: Number(
                entryForm.quantity,
              ),
              unit_cost: entryForm.unit_cost
                ? Number(
                    entryForm.unit_cost,
                  )
                : null,
              supplier_name:
                entryForm.supplier_name.trim() ||
                null,
              notes:
                entryForm.notes.trim() ||
                null,
            }),
          },
        ),
      );

      setEntryModal(false);

      setNotice(
        "Entrada registrada. El lote fue creado automáticamente.",
      );

      await loadItems();

      if (tab === "lots") {
        await loadLots();
      }

      if (tab === "movements") {
        await loadMovements();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la entrada.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveWaste(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await readResponse(
        await fetch(
          "/api/admin/inventory/waste",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inventory_item_id:
                wasteForm.inventory_item_id,
              lot_id:
                wasteForm.lot_id || null,
              quantity: Number(
                wasteForm.quantity,
              ),
              reason:
                wasteForm.reason.trim(),
            }),
          },
        ),
      );

      setWasteModal(false);

      setNotice(
        "Merma registrada correctamente.",
      );

      await loadItems();
      await loadLots();

      if (tab === "movements") {
        await loadMovements();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la merma.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveAdjustment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await readResponse(
        await fetch(
          "/api/admin/inventory/adjustments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inventory_item_id:
                adjustmentForm.inventory_item_id,
              quantity_delta: Number(
                adjustmentForm.quantity_delta,
              ),
              reason:
                adjustmentForm.reason.trim(),
            }),
          },
        ),
      );

      setAdjustmentModal(false);

      setNotice(
        "Ajuste registrado correctamente.",
      );

      await loadItems();

      if (tab === "movements") {
        await loadMovements();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el ajuste.",
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedWasteItem = items.find(
    (item) =>
      item.id ===
      wasteForm.inventory_item_id,
  );

  const wasteLots = lots.filter(
    (lot) =>
      lot.inventory_item_id ===
      wasteForm.inventory_item_id,
  );

  function supplierName(lot: Lot) {
    return (
      lot.entry?.supplier_name ??
      lot.inventory_entry?.supplier_name ??
      "—"
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        eyebrow="Operación"
        title="Inventario"
        description="Controla existencias, lotes, entradas, mermas, ajustes y movimientos."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={openEntry}
            >
              <PackagePlus className="size-4" />
              Registrar entrada
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={openWaste}
            >
              <Trash2 className="size-4" />
              Registrar merma
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={openAdjustment}
            >
              <SlidersHorizontal className="size-4" />
              Ajustar stock
            </Button>

            <Button
              type="button"
              onClick={openNewItem}
            >
              <Plus className="size-4" />
              Nuevo ítem
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-text">
          <span>{notice}</span>

          <button
            type="button"
            className="shrink-0 font-medium text-brand hover:underline"
            onClick={() => setNotice(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span>{error}</span>

          <button
            type="button"
            className="shrink-0 font-medium hover:underline"
            onClick={() => setError(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de ítems"
          value={String(stats.total)}
          icon={<Boxes />}
        />

        <StatCard
          label="Stock bajo"
          value={String(stats.low)}
          description="Requieren reposición"
          icon={<AlertTriangle />}
        />

        <StatCard
          label="Agotados"
          value={String(stats.out)}
          description="Sin existencias"
          icon={<XCircle />}
        />

        <StatCard
          label="Ítems activos"
          value={String(stats.active)}
          icon={<PackagePlus />}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col border-b border-border-decorative px-4 pt-2 sm:flex-row sm:items-end sm:gap-6">
          <button
            type="button"
            onClick={() => setTab("items")}
            className={`flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              tab === "items"
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            <Boxes className="size-4" />
            Ítems
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("movements");
              setMovementPage(0);
            }}
            className={`flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              tab === "movements"
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            <History className="size-4" />
            Historial
          </button>

          <button
            type="button"
            onClick={() => setTab("lots")}
            className={`flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              tab === "lots"
                ? "border-brand text-brand"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            <ClipboardList className="size-4" />
            Lotes FIFO
          </button>
        </div>

        {tab === "items" && (
          <>
            <div className="flex flex-col gap-3 border-b border-border-decorative bg-surface/60 p-4 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar por nombre o SKU..."
                  className="h-10 rounded-lg pl-9"
                  aria-label="Buscar inventario"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "todos"
                      | StockStatus,
                  )
                }
                className="h-10 rounded-lg border border-border-field bg-surface px-3 text-sm text-text outline-none focus:border-brand"
                aria-label="Filtrar por estado"
              >
                <option value="todos">
                  Todos los estados
                </option>
                <option value="normal">
                  Normal
                </option>
                <option value="bajo">
                  Stock bajo
                </option>
                <option value="agotado">
                  Agotado
                </option>
              </select>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as
                      | "todos"
                      | ItemType,
                  )
                }
                className="h-10 rounded-lg border border-border-field bg-surface px-3 text-sm text-text outline-none focus:border-brand"
                aria-label="Filtrar por tipo"
              >
                <option value="todos">
                  Todos los tipos
                </option>

                {Object.entries(
                  TYPE_LABELS,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map(
                  (row) => (
                    <div
                      key={row}
                      className="h-12 animate-pulse rounded-lg bg-muted/50"
                    />
                  ),
                )}
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={<Boxes />}
                title={
                  items.length === 0
                    ? "No hay ítems de inventario"
                    : "Sin resultados"
                }
                description={
                  items.length === 0
                    ? "Crea el primer ítem para comenzar a controlar existencias."
                    : "Prueba con otros filtros o términos de búsqueda."
                }
                action={
                  items.length === 0 ? (
                    <Button
                      onClick={openNewItem}
                    >
                      <Plus className="size-4" />
                      Nuevo ítem
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Ítem
                    </TableHead>
                    <TableHead>
                      SKU
                    </TableHead>
                    <TableHead>
                      Tipo
                    </TableHead>
                    <TableHead numeric>
                      Stock actual
                    </TableHead>
                    <TableHead numeric>
                      Mínimo
                    </TableHead>
                    <TableHead>
                      Estado
                    </TableHead>
                    <TableHead>
                      Activo
                    </TableHead>
                    <TableHead className="w-20 text-right">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredItems.map(
                    (item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="min-w-[170px]">
                            <p className="font-medium">
                              {item.name}
                            </p>

                            <p className="text-xs text-text-secondary">
                              {item.unit}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-text-secondary">
                          {item.sku || "—"}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {
                              TYPE_LABELS[
                                item.item_type
                              ]
                            }
                          </Badge>
                        </TableCell>

                        <TableCell
                          numeric
                          className="font-semibold"
                        >
                          {formatNumber(
                            item.current_stock,
                          )}{" "}
                          {item.unit}
                        </TableCell>

                        <TableCell
                          numeric
                          className="text-text-secondary"
                        >
                          {formatNumber(
                            item.minimum_stock,
                          )}{" "}
                          {item.unit}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={statusVariant(
                              item.stock_status,
                            )}
                          >
                            {
                              STATUS_LABELS[
                                item.stock_status
                              ]
                            }
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              item.is_active
                                ? "brand"
                                : "outline"
                            }
                          >
                            {item.is_active
                              ? "Activo"
                              : "Inactivo"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Editar ${item.name}`}
                              onClick={() =>
                                openEditItem(
                                  item,
                                )
                              }
                            >
                              <Edit3 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {tab === "movements" && (
          <>
            <div className="flex flex-col gap-3 border-b border-border-decorative p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Historial de movimientos
                </p>

                <p className="mt-1 text-xs text-text-secondary">
                  Entradas, salidas, mermas, ajustes y devoluciones.
                </p>
              </div>

              <select
                value={movementFilter}
                onChange={(event) => {
                  setMovementFilter(
                    event.target.value as
                      | "todos"
                      | MovementType,
                  );
                  setMovementPage(0);
                }}
                className="h-10 rounded-lg border border-border-field bg-surface px-3 text-sm text-text outline-none focus:border-brand"
                aria-label="Filtrar movimientos"
              >
                <option value="todos">
                  Todos los movimientos
                </option>

                {Object.entries(
                  MOVEMENT_LABELS,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {historyLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map(
                  (row) => (
                    <div
                      key={row}
                      className="h-12 animate-pulse rounded-lg bg-muted/50"
                    />
                  ),
                )}
              </div>
            ) : movements.length === 0 ? (
              <EmptyState
                icon={<History />}
                title="Sin movimientos"
                description="Todavía no hay movimientos registrados para los filtros seleccionados."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Fecha
                      </TableHead>
                      <TableHead>
                        Ítem
                      </TableHead>
                      <TableHead>
                        Tipo
                      </TableHead>
                      <TableHead numeric>
                        Cantidad
                      </TableHead>
                      <TableHead>
                        Motivo
                      </TableHead>
                      <TableHead>
                        Registrado por
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {movements.map(
                      (movement) => (
                        <TableRow
                          key={movement.id}
                        >
                          <TableCell className="whitespace-nowrap text-xs text-text-secondary">
                            {formatDate(
                              movement.created_at,
                            )}
                          </TableCell>

                          <TableCell className="font-medium">
                            {movement
                              .inventory_item
                              ?.name ??
                              "Ítem"}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={movementVariant(
                                movement.movement_type,
                              )}
                            >
                              {
                                MOVEMENT_LABELS[
                                  movement
                                    .movement_type
                                ]
                              }
                            </Badge>
                          </TableCell>

                          <TableCell
                            numeric
                            className="font-semibold"
                          >
                            {formatNumber(
                              movement.quantity,
                            )}{" "}
                            {movement
                              .inventory_item
                              ?.unit ?? ""}
                          </TableCell>

                          <TableCell className="max-w-[260px] truncate text-text-secondary">
                            {movement.reason ||
                              "—"}
                          </TableCell>

                          <TableCell>
                            {movement.created_by_name ||
                              "Sin nombre"}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>

                <div className="flex flex-col gap-3 border-t border-border-decorative px-4 py-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Página {movementPage + 1} de{" "}
                    {movementPages} ·{" "}
                    {movementTotal} movimientos
                  </span>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={
                        movementPage === 0
                      }
                      onClick={() =>
                        setMovementPage(
                          (page) =>
                            page - 1,
                        )
                      }
                      aria-label="Página anterior"
                    >
                      <ChevronLeft />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={
                        movementPage + 1 >=
                        movementPages
                      }
                      onClick={() =>
                        setMovementPage(
                          (page) =>
                            page + 1,
                        )
                      }
                      aria-label="Página siguiente"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "lots" && (
          <>
            <div className="border-b border-border-decorative p-4">
              <p className="text-sm font-medium">
                Lotes disponibles
              </p>

              <p className="mt-1 text-xs text-text-secondary">
                Ordenados de más antiguo a más reciente. El lote marcado como FIFO se consume primero.
              </p>
            </div>

            {lotsLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map(
                  (row) => (
                    <div
                      key={row}
                      className="h-12 animate-pulse rounded-lg bg-muted/50"
                    />
                  ),
                )}
              </div>
            ) : lots.length === 0 ? (
              <EmptyState
                icon={<ClipboardList />}
                title="Sin lotes disponibles"
                description="Los lotes se crean automáticamente al registrar entradas."
                action={
                  <Button
                    onClick={openEntry}
                  >
                    <PackagePlus className="size-4" />
                    Registrar entrada
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Ítem
                    </TableHead>
                    <TableHead>
                      Proveedor
                    </TableHead>
                    <TableHead>
                      Recibido
                    </TableHead>
                    <TableHead numeric>
                      Inicial
                    </TableHead>
                    <TableHead numeric>
                      Restante
                    </TableHead>
                    <TableHead>
                      FIFO
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {lots.map((lot) => (
                    <TableRow
                      key={lot.id}
                    >
                      <TableCell className="font-medium">
                        {lot.inventory_item
                          ?.name ??
                          "Ítem"}
                      </TableCell>

                      <TableCell className="text-text-secondary">
                        {supplierName(lot)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-text-secondary">
                        {formatDate(
                          lot.received_at,
                        )}
                      </TableCell>

                      <TableCell numeric>
                        {formatNumber(
                          lot.initial_quantity,
                        )}{" "}
                        {lot.inventory_item
                          ?.unit ?? ""}
                      </TableCell>

                      <TableCell
                        numeric
                        className="font-semibold"
                      >
                        {formatNumber(
                          lot.remaining_quantity,
                        )}{" "}
                        {lot.inventory_item
                          ?.unit ?? ""}
                      </TableCell>

                      <TableCell>
                        {lot.fifo_next ? (
                          <Badge variant="brand">
                            Siguiente
                          </Badge>
                        ) : (
                          <span className="text-text-secondary">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Card>

      <Modal
        open={itemModal}
        onOpenChange={setItemModal}
      >
        <ModalContent className="md:max-w-xl">
          <ModalHeader>
            <ModalTitle>
              {editingItem
                ? "Editar ítem"
                : "Nuevo ítem de inventario"}
            </ModalTitle>

            <ModalDescription>
              {editingItem
                ? "Actualiza los datos del ítem. El historial de movimientos se conserva."
                : "Registra el artículo que quieres controlar en inventario."}
            </ModalDescription>
          </ModalHeader>

          <form
            onSubmit={saveItem}
            className="space-y-4"
          >
            <Field
              label="Nombre"
              required
            >
              <Input
                value={itemForm.name}
                onChange={(event) =>
                  setItemForm((form) => ({
                    ...form,
                    name: event.target.value,
                  }))
                }
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="SKU"
                optional
              >
                <Input
                  value={itemForm.sku}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      sku: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field
                label="Unidad"
                required
              >
                <Input
                  value={itemForm.unit}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      unit: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tipo"
                required
              >
                <select
                  value={itemForm.item_type}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      item_type:
                        event.target
                          .value as ItemType,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-border-field bg-surface px-3.5 text-sm text-text outline-none focus:border-brand"
                >
                  {Object.entries(
                    TYPE_LABELS,
                  ).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field
                label="Stock mínimo"
                required
              >
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={
                    itemForm.minimum_stock
                  }
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      minimum_stock:
                        event.target.value,
                    }))
                  }
                  required
                />
              </Field>
            </div>

            {editingItem && (
              <label className="flex items-center gap-3 rounded-xl border border-border-field px-3.5 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={
                    itemForm.is_active
                  }
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      is_active:
                        event.target.checked,
                    }))
                  }
                />
                Ítem activo
              </label>
            )}

            <ModalFooter>
              <ModalClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </ModalClose>

              <Button
                type="submit"
                loading={saving}
                loadingText="Guardando..."
              >
                {editingItem
                  ? "Guardar cambios"
                  : "Crear ítem"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal
        open={entryModal}
        onOpenChange={setEntryModal}
      >
        <ModalContent className="md:max-w-xl">
          <ModalHeader>
            <ModalTitle>
              Registrar entrada
            </ModalTitle>

            <ModalDescription>
              La entrada aumenta el stock y crea automáticamente un lote para FIFO.
            </ModalDescription>
          </ModalHeader>

          <form
            onSubmit={saveEntry}
            className="space-y-4"
          >
            <Field
              label="Ítem"
              required
            >
              <select
                value={
                  entryForm.inventory_item_id
                }
                onChange={(event) =>
                  setEntryForm((form) => ({
                    ...form,
                    inventory_item_id:
                      event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-border-field bg-surface px-3.5 text-sm text-text outline-none focus:border-brand"
                required
              >
                {availableItems.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} ·{" "}
                      {item.unit}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Cantidad"
                required
              >
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={
                    entryForm.quantity
                  }
                  onChange={(event) =>
                    setEntryForm((form) => ({
                      ...form,
                      quantity:
                        event.target.value,
                    }))
                  }
                  required
                />
              </Field>

              <Field
                label="Costo unitario"
                optional
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    entryForm.unit_cost
                  }
                  onChange={(event) =>
                    setEntryForm((form) => ({
                      ...form,
                      unit_cost:
                        event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <Field
              label="Proveedor"
              optional
            >
              <Input
                value={
                  entryForm.supplier_name
                }
                onChange={(event) =>
                  setEntryForm((form) => ({
                    ...form,
                    supplier_name:
                      event.target.value,
                  }))
                }
              />
            </Field>

            <Field
              label="Notas"
              optional
            >
              <Textarea
                value={entryForm.notes}
                onChange={(event) =>
                  setEntryForm((form) => ({
                    ...form,
                    notes: event.target.value,
                  }))
                }
              />
            </Field>

            <ModalFooter>
              <ModalClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </ModalClose>

              <Button
                type="submit"
                loading={saving}
                loadingText="Registrando..."
              >
                Registrar entrada
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal
        open={wasteModal}
        onOpenChange={setWasteModal}
      >
        <ModalContent className="md:max-w-xl">
          <ModalHeader>
            <ModalTitle>
              Registrar merma
            </ModalTitle>

            <ModalDescription>
              La merma descuenta stock. El motivo es obligatorio.
            </ModalDescription>
          </ModalHeader>

          <form
            onSubmit={saveWaste}
            className="space-y-4"
          >
            <Field
              label="Ítem"
              required
            >
              <select
                value={
                  wasteForm.inventory_item_id
                }
                onChange={(event) =>
                  setWasteForm((form) => ({
                    ...form,
                    inventory_item_id:
                      event.target.value,
                    lot_id: "",
                  }))
                }
                className="h-11 w-full rounded-xl border border-border-field bg-surface px-3.5 text-sm text-text outline-none focus:border-brand"
                required
              >
                {availableItems.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} · stock{" "}
                      {formatNumber(
                        item.current_stock,
                      )}{" "}
                      {item.unit}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              label="Lote"
              optional
              hint="Si no eliges lote, la merma se descuenta del stock general."
            >
              <select
                value={wasteForm.lot_id}
                onChange={(event) =>
                  setWasteForm((form) => ({
                    ...form,
                    lot_id:
                      event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-border-field bg-surface px-3.5 text-sm text-text outline-none focus:border-brand"
              >
                <option value="">
                  Sin lote específico
                </option>

                {wasteLots.map(
                  (lot) => (
                    <option
                      key={lot.id}
                      value={lot.id}
                    >
                      {formatDate(
                        lot.received_at,
                      )}{" "}
                      ·{" "}
                      {formatNumber(
                        lot.remaining_quantity,
                      )}{" "}
                      {selectedWasteItem?.unit ??
                        ""}
                      {lot.fifo_next
                        ? " · FIFO"
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              label="Cantidad"
              required
            >
              <Input
                type="number"
                min="0.001"
                step="0.001"
                max={
                  selectedWasteItem?.current_stock ??
                  undefined
                }
                value={
                  wasteForm.quantity
                }
                onChange={(event) =>
                  setWasteForm((form) => ({
                    ...form,
                    quantity:
                      event.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field
              label="Motivo"
              required
            >
              <Textarea
                value={wasteForm.reason}
                onChange={(event) =>
                  setWasteForm((form) => ({
                    ...form,
                    reason:
                      event.target.value,
                  }))
                }
                required
              />
            </Field>

            <ModalFooter>
              <ModalClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </ModalClose>

              <Button
                type="submit"
                variant="destructive"
                loading={saving}
                loadingText="Registrando..."
              >
                Registrar merma
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal
        open={adjustmentModal}
        onOpenChange={
          setAdjustmentModal
        }
      >
        <ModalContent className="md:max-w-xl">
          <ModalHeader>
            <ModalTitle>
              Ajustar stock
            </ModalTitle>

            <ModalDescription>
              Usa cantidades positivas para sumar y negativas para descontar. El stock no puede quedar negativo.
            </ModalDescription>
          </ModalHeader>

          <form
            onSubmit={saveAdjustment}
            className="space-y-4"
          >
            <Field
              label="Ítem"
              required
            >
              <select
                value={
                  adjustmentForm.inventory_item_id
                }
                onChange={(event) =>
                  setAdjustmentForm((form) => ({
                    ...form,
                    inventory_item_id:
                      event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-border-field bg-surface px-3.5 text-sm text-text outline-none focus:border-brand"
                required
              >
                {availableItems.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} · stock{" "}
                      {formatNumber(
                        item.current_stock,
                      )}{" "}
                      {item.unit}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              label="Ajuste"
              required
              hint="Ejemplo: 2 para sumar dos unidades o -2 para descontarlas."
            >
              <Input
                type="number"
                step="0.001"
                value={
                  adjustmentForm.quantity_delta
                }
                onChange={(event) =>
                  setAdjustmentForm((form) => ({
                    ...form,
                    quantity_delta:
                      event.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field
              label="Motivo"
              required
            >
              <Textarea
                value={
                  adjustmentForm.reason
                }
                onChange={(event) =>
                  setAdjustmentForm((form) => ({
                    ...form,
                    reason:
                      event.target.value,
                  }))
                }
                required
              />
            </Field>

            <ModalFooter>
              <ModalClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </ModalClose>

              <Button
                type="submit"
                loading={saving}
                loadingText="Guardando..."
              >
                Guardar ajuste
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
