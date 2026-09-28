"use client";

import { useEffect, useState } from "react";

import {
  Check,
  PackageCheck,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  item_type: string;
  is_active: boolean;
};

type InventoryRequirement = {
  id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
  created_at: string;
  inventory_item: InventoryItem;
};

type ProductInventoryManagementProps = {
  productId: string;
};

const selectClassName =
  "h-11 w-full rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

function formatQuantity(value: number) {
  return Number.isInteger(Number(value))
    ? String(Number(value))
    : Number(value).toLocaleString("es-BO", {
        maximumFractionDigits: 3,
      });
}

function formatUnit(unit: string) {
  return unit?.trim() || "unidad";
}

export default function ProductInventoryManagement({
  productId,
}: ProductInventoryManagementProps) {
  const [inventoryItems, setInventoryItems] = useState<
    InventoryItem[]
  >([]);

  const [requirements, setRequirements] = useState<
    InventoryRequirement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inventoryItemId, setInventoryItemId] = useState("");
  const [inventoryQuantity, setInventoryQuantity] = useState("1");

  const [editingRequirementId, setEditingRequirementId] =
    useState<string | null>(null);
  const [editingRequirementQuantity, setEditingRequirementQuantity] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadInventoryItems() {
    setLoadingItems(true);

    try {
      const response = await fetch(
        "/api/admin/inventory/items",
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudieron cargar los ítems de inventario.",
        );
      }

      setInventoryItems(result.items ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los ítems de inventario.",
      );
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadRequirements() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/inventory-requirements`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo cargar el consumo de inventario.",
        );
      }

      setRequirements(result.requirements ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el consumo de inventario.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([
      loadInventoryItems(),
      loadRequirements(),
    ]);
  }, [productId]);

  async function addRequirement() {
    setError("");
    setMessage("");

    const quantity = Number(inventoryQuantity);

    if (!inventoryItemId) {
      setError("Selecciona un ítem de inventario.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/inventory-requirements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventory_item_id: inventoryItemId,
            quantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo agregar el consumo de inventario.",
        );
      }

      setInventoryItemId("");
      setInventoryQuantity("1");
      setMessage("Ítem de inventario agregado correctamente.");

      await loadRequirements();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el consumo de inventario.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateRequirement(requirementId: string) {
    const quantity = Number(editingRequirementQuantity);

    setError("");
    setMessage("");

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/inventory-requirements/${requirementId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo actualizar el consumo.",
        );
      }

      setEditingRequirementId(null);
      setEditingRequirementQuantity("");
      setMessage("Cantidad actualizada correctamente.");

      await loadRequirements();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el consumo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRequirement(requirementId: string) {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/inventory-requirements/${requirementId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo eliminar el consumo.",
        );
      }

      setMessage("Ítem eliminado del consumo de inventario.");

      await loadRequirements();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el consumo.",
      );
    } finally {
      setSaving(false);
    }
  }

  const availableInventoryItems = inventoryItems.filter(
    (item) =>
      item.is_active &&
      !requirements.some(
        (requirement) =>
          requirement.inventory_item_id === item.id,
      ),
  );

  const isLoading = loading || loadingItems;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-medium text-text">
          Consumo de inventario
        </h4>

        <p className="mt-1 text-xs text-text-secondary">
          Define qué cantidad de cada ítem se descuenta cuando
          se vende una unidad de este producto.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-leaf/20 bg-leaf/5 px-3 py-2 text-sm text-leaf">
          {message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_140px_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`inventory-item-${productId}`}
            className="text-[13px] font-medium uppercase tracking-[0.02em] text-text"
          >
            Ítem de inventario
          </label>

          <select
            id={`inventory-item-${productId}`}
            value={inventoryItemId}
            onChange={(event) =>
              setInventoryItemId(event.target.value)
            }
            disabled={isLoading || saving}
            className={selectClassName}
          >
            <option value="">
              {loadingItems
                ? "Cargando ítems..."
                : "Seleccionar ítem"}
            </option>

            {availableInventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({formatUnit(item.unit)})
              </option>
            ))}
          </select>
        </div>

        <Field label="Cantidad">
          <Input
            type="number"
            min="0.001"
            step="0.001"
            value={inventoryQuantity}
            onChange={(event) =>
              setInventoryQuantity(event.target.value)
            }
            disabled={isLoading || saving}
          />
        </Field>

        <Button
          type="button"
          onClick={() => void addRequirement()}
          loading={saving}
          loadingText="Agregando…"
          disabled={isLoading}
        >
          <Plus aria-hidden="true" />
          Agregar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary">
          Cargando consumo de inventario...
        </p>
      ) : requirements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-decorative px-4 py-6 text-center">
          <PackageCheck
            aria-hidden="true"
            className="mx-auto mb-2 size-6 text-text-secondary"
          />

          <p className="text-sm text-text-secondary">
            Este producto todavía no tiene consumo de
            inventario definido.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {requirements.map((requirement) => {
            const isEditing =
              editingRequirementId === requirement.id;

            return (
              <div
                key={requirement.id}
                className="rounded-xl border border-border-decorative bg-bg-admin p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-text">
                      {requirement.inventory_item.name}
                    </p>

                    <p className="mt-0.5 text-xs text-text-secondary">
                      Stock actual:{" "}
                      {formatQuantity(
                        requirement.inventory_item.current_stock,
                      )}{" "}
                      {formatUnit(
                        requirement.inventory_item.unit,
                      )}
                    </p>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-wrap items-end gap-2">
                      <Field label="Cantidad">
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={editingRequirementQuantity}
                          onChange={(event) =>
                            setEditingRequirementQuantity(
                              event.target.value,
                            )
                          }
                          className="w-32"
                          disabled={saving}
                        />
                      </Field>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          void updateRequirement(
                            requirement.id,
                          )
                        }
                        disabled={saving}
                      >
                        <Check aria-hidden="true" />
                        Guardar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRequirementId(null);
                          setEditingRequirementQuantity("");
                        }}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand">
                        {formatQuantity(requirement.quantity)}{" "}
                        {formatUnit(
                          requirement.inventory_item.unit,
                        )}
                      </span>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRequirementId(
                            requirement.id,
                          );
                          setEditingRequirementQuantity(
                            String(requirement.quantity),
                          );
                        }}
                        disabled={saving}
                      >
                        <Pencil aria-hidden="true" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void deleteRequirement(
                            requirement.id,
                          )
                        }
                        disabled={saving}
                      >
                        <Trash2 aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}