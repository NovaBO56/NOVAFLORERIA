
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_available: boolean;
  is_sold_out: boolean;
};

type ProductComponent = {
  id: string;
  parent_product_id: string;
  component_product_id: string;
  quantity: number;
  created_at: string;
  component_product: Product;
};

type ProductComponentManagementProps = {
  productId: string;
};

const selectClassName =
  "h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-base text-text outline-none transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

export default function ProductComponentManagement({
  productId,
}: ProductComponentManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [componentProductId, setComponentProductId] =
    useState("");
  const [quantity, setQuantity] = useState("1");
  const [editingComponentId, setEditingComponentId] =
    useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingComponentId, setSavingComponentId] =
    useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    const response = await fetch("/api/admin/products");

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ??
          "No se pudieron cargar los productos.",
      );
    }

    setProducts(result.products ?? []);
  }, []);

  const loadComponents = useCallback(async () => {
    const response = await fetch(
      `/api/admin/products/${productId}/components`,
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ??
          "No se pudieron cargar los componentes.",
      );
    }

    setComponents(result.components ?? []);
  }, [productId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadProducts(),
        loadComponents(),
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los componentes.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadComponents]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadData]);

  async function handleAddComponent() {
    setError("");
    setMessage("");

    const parsedQuantity = Number(quantity);

    if (!componentProductId) {
      setError("Selecciona un producto componente.");
      return;
    }

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/components`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            component_product_id: componentProductId,
            quantity: parsedQuantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ??
            "No se pudo agregar el componente.",
        );
      }

      setComponentProductId("");
      setQuantity("1");
      setMessage("Componente agregado correctamente.");

      await loadComponents();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el componente.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditingComponent(component: ProductComponent) {
    setEditingComponentId(component.id);
    setEditingQuantity(String(component.quantity));
    setError("");
    setMessage("");
  }

  function cancelEditingComponent() {
    setEditingComponentId(null);
    setEditingQuantity("");
  }

  async function handleUpdateComponent(
    component: ProductComponent,
  ) {
    setError("");
    setMessage("");

    const parsedQuantity = Number(editingQuantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }

    setSavingComponentId(component.id);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/components/${component.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: parsedQuantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ??
            "No se pudo actualizar el componente.",
        );
      }

      setMessage("Cantidad del componente actualizada.");
      cancelEditingComponent();

      await loadComponents();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el componente.",
      );
    } finally {
      setSavingComponentId(null);
    }
  }

  async function handleDeleteComponent(
    componentId: string,
  ) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/components/${componentId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ??
            "No se pudo eliminar el componente.",
        );
      }

      setMessage("Componente eliminado correctamente.");

      await loadComponents();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el componente.",
      );
    }
  }

  const existingComponentIds = new Set(
    components.map(
      (component) => component.component_product_id,
    ),
  );

  const availableProducts = products.filter(
    (product) =>
      product.id !== productId &&
      !existingComponentIds.has(product.id),
  );

  return (
    <div className="mt-2 flex flex-col gap-3 border-t border-border-decorative pt-4">
      <div>
        <h4 className="font-medium text-text">
          Componentes del producto
        </h4>
        <p className="text-text-secondary">
          Permite definir qué productos forman parte de este
          producto compuesto.
        </p>
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {message && (
        <p className="text-sm text-leaf">{message}</p>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_140px_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`component-product-${productId}`}
            className="text-[13px] leading-[1.4] font-medium tracking-[0.02em] text-text uppercase"
          >
            Producto componente
          </label>

          <select
            id={`component-product-${productId}`}
            value={componentProductId}
            onChange={(event) =>
              setComponentProductId(event.target.value)
            }
            disabled={saving || loading}
            className={selectClassName}
          >
            <option value="">
              Seleccionar producto
            </option>

            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="Cantidad">
          <Input
            type="number"
            min="0.001"
            step="0.001"
            value={quantity}
            onChange={(event) =>
              setQuantity(event.target.value)
            }
            disabled={saving || loading}
            placeholder="Cantidad"
          />
        </Field>

        <Button
          type="button"
          onClick={() => void handleAddComponent()}
          loading={saving}
          loadingText="Agregando…"
          disabled={loading}
        >
          Agregar
        </Button>
      </div>

      {loading ? (
        <p className="text-text-secondary">
          Cargando componentes...
        </p>
      ) : components.length === 0 ? (
        <p className="text-text-secondary">
          Este producto todavía no tiene componentes.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {components.map((component) => {
            const isEditing =
              editingComponentId === component.id;
            const isSaving =
              savingComponentId === component.id;

            return (
              <Card
                key={component.id}
                className="gap-3 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text">
                      {component.component_product.name}
                    </p>

                    {!isEditing && (
                      <p className="text-text-secondary">
                        Cantidad: {component.quantity}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          startEditingComponent(component)
                        }
                        disabled={saving || isSaving}
                      >
                        <Pencil aria-hidden="true" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void handleDeleteComponent(
                            component.id,
                          )
                        }
                        disabled={saving || isSaving}
                      >
                        <Trash2 aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="w-full sm:max-w-[180px]">
                      <Field label="Cantidad">
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={editingQuantity}
                          onChange={(event) =>
                            setEditingQuantity(
                              event.target.value,
                            )
                          }
                          disabled={isSaving}
                          autoFocus
                        />
                      </Field>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditingComponent}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          void handleUpdateComponent(
                            component,
                          )
                        }
                        loading={isSaving}
                        loadingText="Guardando…"
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
