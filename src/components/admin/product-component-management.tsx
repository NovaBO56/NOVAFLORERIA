
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

export default function ProductComponentManagement({
  productId,
}: ProductComponentManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [components, setComponents] = useState<
    ProductComponent[]
  >([]);
  const [componentProductId, setComponentProductId] =
    useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    const response = await fetch(
      "/api/admin/products",
    );

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
      setError(
        "Selecciona un producto componente.",
      );
      return;
    }

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "La cantidad debe ser mayor que cero.",
      );
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
            component_product_id:
              componentProductId,
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
      setMessage(
        "Componente agregado correctamente.",
      );

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

      setMessage(
        "Componente eliminado correctamente.",
      );

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
      (component) =>
        component.component_product_id,
    ),
  );

  const availableProducts = products.filter(
    (product) =>
      product.id !== productId &&
      !existingComponentIds.has(product.id),
  );

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-lg font-semibold">
          Componentes del producto
        </h3>

        <p className="text-sm text-muted-foreground">
          Permite definir qué productos forman parte
          de este producto compuesto.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p className="text-sm text-green-600">
          {message}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
        <select
          value={componentProductId}
          onChange={(event) =>
            setComponentProductId(
              event.target.value,
            )
          }
          disabled={saving || loading}
          className="rounded-md border px-3 py-2"
        >
          <option value="">
            Seleccionar producto
          </option>

          {availableProducts.map((product) => (
            <option
              key={product.id}
              value={product.id}
            >
              {product.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0.001"
          step="0.001"
          value={quantity}
          onChange={(event) =>
            setQuantity(event.target.value)
          }
          disabled={saving || loading}
          className="rounded-md border px-3 py-2"
          placeholder="Cantidad"
        />

        <button
          type="button"
          onClick={() =>
            void handleAddComponent()
          }
          disabled={saving || loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Agregando..." : "Agregar"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          Cargando componentes...
        </p>
      ) : components.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este producto todavía no tiene
          componentes.
        </p>
      ) : (
        <div className="space-y-2">
          {components.map((component) => (
            <div
              key={component.id}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <div>
                <p className="font-medium">
                  {
                    component.component_product
                      .name
                  }
                </p>

                <p className="text-sm text-muted-foreground">
                  Cantidad: {component.quantity}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleDeleteComponent(
                    component.id,
                  )
                }
                disabled={saving}
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
