"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";

type PromotionType = "producto" | "combo";

type DiscountType = "porcentaje" | "monto_fijo";

type Promotion = {
  id: string;
  name: string;
  description: string | null;
  promotion_type: PromotionType;
  discount_type: DiscountType | null;
  discount_value: number | null;
  combo_price: number | null;
  starts_at: string | null;
  ends_at: string | null;
  minimum_purchase: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  is_available?: boolean;
  is_sold_out?: boolean;
  images?: {
    id: string;
    public_url: string;
    alt_text: string | null;
    sort_order?: number;
  }[];
};

type PromotionProduct = {
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
  } | null;
};

type SelectedProduct = {
  productId: string;
  quantity: string;
};

type PromotionForm = {
  name: string;
  description: string;
  promotion_type: PromotionType;
  discount_type: DiscountType;
  discount_value: string;
  combo_price: string;
  starts_at: string;
  ends_at: string;
  minimum_purchase: string;
};

const initialForm: PromotionForm = {
  name: "",
  description: "",
  promotion_type: "producto",
  discount_type: "porcentaje",
  discount_value: "",
  combo_price: "",
  starts_at: "",
  ends_at: "",
  minimum_purchase: "",
};

const promotionTypeLabels: Record<PromotionType, string> = {
  producto: "Promoción de producto",
  combo: "Combo",
};

function formatMoney(value: number) {
  return `Bs ${Number(value).toFixed(2)}`;
}

function formatDiscount(promotion: Promotion) {
  if (promotion.promotion_type === "combo") {
    return promotion.combo_price !== null
      ? formatMoney(Number(promotion.combo_price))
      : "Sin precio";
  }

  if (promotion.discount_type === "porcentaje") {
    return `${Number(promotion.discount_value ?? 0).toFixed(0)}%`;
  }

  return formatMoney(Number(promotion.discount_value ?? 0));
}

function formatDate(value: string | null) {
  if (!value) return "Sin límite";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function toISOStringOrNull(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    SelectedProduct[]
  >([]);

  const [form, setForm] = useState<PromotionForm>(initialForm);
  const [editingPromotion, setEditingPromotion] =
    useState<Promotion | null>(null);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [associationLoading, setAssociationLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPromotions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/promotions", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudieron cargar las promociones.",
        );
      }

      setPromotions(result.promotions ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las promociones.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      setProductsLoading(true);

      const response = await fetch(
        "/api/products?limit=60&page=1&sort=name&order=asc",
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudieron cargar los productos.",
        );
      }

      setProducts(result.products ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos.",
      );
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    void loadPromotions();
    void loadProducts();
  }, []);

  function updateForm(
    field: keyof PromotionForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedProducts([]);
    setEditingPromotion(null);
    setError("");
  }

  function toggleProduct(productId: string) {
    setSelectedProducts((current) => {
      const exists = current.some(
        (item) => item.productId === productId,
      );

      if (exists) {
        return current.filter(
          (item) => item.productId !== productId,
        );
      }

      return [
        ...current,
        {
          productId,
          quantity: "1",
        },
      ];
    });
  }

  function updateProductQuantity(
    productId: string,
    quantity: string,
  ) {
    setSelectedProducts((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  async function loadPromotionProducts(
    promotionId: string,
  ) {
    try {
      setAssociationLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/promotions/${promotionId}/products`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudieron cargar los productos de la promoción.",
        );
      }

      const associations: PromotionProduct[] =
        result.products ?? result.promotion_products ?? [];

      setSelectedProducts(
        associations.map((item) => ({
          productId: item.product_id,
          quantity: String(item.quantity ?? 1),
        })),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos de la promoción.",
      );
    } finally {
      setAssociationLoading(false);
    }
  }

  async function startEditing(promotion: Promotion) {
    setEditingPromotion(promotion);

    setForm({
      name: promotion.name,
      description: promotion.description ?? "",
      promotion_type: promotion.promotion_type,
      discount_type:
        promotion.discount_type ?? "porcentaje",
      discount_value:
        promotion.discount_value !== null
          ? String(promotion.discount_value)
          : "",
      combo_price:
        promotion.combo_price !== null
          ? String(promotion.combo_price)
          : "",
      starts_at: toDateTimeLocal(promotion.starts_at),
      ends_at: toDateTimeLocal(promotion.ends_at),
      minimum_purchase:
        promotion.minimum_purchase !== null
          ? String(promotion.minimum_purchase)
          : "",
    });

    setSelectedProducts([]);
    setError("");
    setSuccess("");

    await loadPromotionProducts(promotion.id);
  }

  async function syncPromotionProducts(
    promotionId: string,
  ) {
    const response = await fetch(
      `/api/admin/promotions/${promotionId}/products`,
      {
        cache: "no-store",
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          result.error ||
          "No se pudieron consultar los productos de la promoción.",
      );
    }

    const currentProducts: PromotionProduct[] =
      result.products ?? result.promotion_products ?? [];

    const currentMap = new Map(
      currentProducts.map((item) => [
        item.product_id,
        item,
      ]),
    );

    const selectedIds = new Set(
      selectedProducts.map((item) => item.productId),
    );

    for (const current of currentProducts) {
      if (!selectedIds.has(current.product_id)) {
        const deleteResponse = await fetch(
          `/api/admin/promotions/${promotionId}/products/${current.product_id}`,
          {
            method: "DELETE",
          },
        );

        const deleteResult = await deleteResponse.json();

        if (!deleteResponse.ok || !deleteResult.success) {
          throw new Error(
            deleteResult.message ||
              deleteResult.error ||
              "No se pudo quitar un producto de la promoción.",
          );
        }
      }
    }

    for (const selected of selectedProducts) {
      const quantity =
        form.promotion_type === "combo"
          ? Number(selected.quantity)
          : 1;

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(
          "Todas las cantidades de los productos deben ser mayores que cero.",
        );
      }

      const existing = currentMap.get(
        selected.productId,
      );

      if (existing) {
        if (
          Number(existing.quantity) !== quantity
        ) {
          const patchResponse = await fetch(
            `/api/admin/promotions/${promotionId}/products/${selected.productId}`,
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

          const patchResult =
            await patchResponse.json();

          if (
            !patchResponse.ok ||
            !patchResult.success
          ) {
            throw new Error(
              patchResult.message ||
                patchResult.error ||
                "No se pudo actualizar la cantidad del producto.",
            );
          }
        }
      } else {
        const postResponse = await fetch(
          `/api/admin/promotions/${promotionId}/products`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product_id: selected.productId,
              quantity,
            }),
          },
        );

        const postResult = await postResponse.json();

        if (
          !postResponse.ok ||
          !postResult.success
        ) {
          throw new Error(
            postResult.message ||
              postResult.error ||
              "No se pudo agregar un producto a la promoción.",
          );
        }
      }
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError(
        "El nombre de la promoción es obligatorio.",
      );
      return;
    }

    if (name.length > 150) {
      setError(
        "El nombre de la promoción es demasiado largo.",
      );
      return;
    }

    if (description.length > 500) {
      setError("La descripción es demasiado larga.");
      return;
    }

    if (selectedProducts.length === 0) {
      setError(
        form.promotion_type === "combo"
          ? "Debes seleccionar al menos un producto para el combo."
          : "Debes seleccionar al menos un producto para la promoción.",
      );
      return;
    }

    let discountValue: number | null = null;
    let comboPrice: number | null = null;

    if (form.promotion_type === "producto") {
      discountValue = Number(form.discount_value);

      if (
        !form.discount_value ||
        !Number.isFinite(discountValue) ||
        discountValue < 0
      ) {
        setError(
          "El valor del descuento no es válido.",
        );
        return;
      }

      if (
        form.discount_type === "porcentaje" &&
        discountValue > 100
      ) {
        setError(
          "El porcentaje de descuento no puede superar el 100%.",
        );
        return;
      }
    } else {
      comboPrice = Number(form.combo_price);

      if (
        !form.combo_price ||
        !Number.isFinite(comboPrice) ||
        comboPrice < 0
      ) {
        setError(
          "El precio del combo no es válido.",
        );
        return;
      }

      for (const item of selectedProducts) {
        const quantity = Number(item.quantity);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          setError(
            "Todas las cantidades del combo deben ser mayores que cero.",
          );
          return;
        }
      }
    }

    const minimumPurchase = form.minimum_purchase
      ? Number(form.minimum_purchase)
      : null;

    if (
      minimumPurchase !== null &&
      (!Number.isFinite(minimumPurchase) ||
        minimumPurchase < 0)
    ) {
      setError("La compra mínima no es válida.");
      return;
    }

    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.starts_at) >=
        new Date(form.ends_at)
    ) {
      setError(
        "La fecha de finalización debe ser posterior a la fecha de inicio.",
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingPromotion);

      const body =
        form.promotion_type === "producto"
          ? {
              name,
              description: description || null,
              promotion_type: "producto",
              discount_type: form.discount_type,
              discount_value: discountValue,
              combo_price: null,
              starts_at: toISOStringOrNull(
                form.starts_at,
              ),
              ends_at: toISOStringOrNull(
                form.ends_at,
              ),
              minimum_purchase: minimumPurchase,
            }
          : {
              name,
              description: description || null,
              promotion_type: "combo",
              combo_price: comboPrice,
              discount_type: null,
              discount_value: null,
              starts_at: toISOStringOrNull(
                form.starts_at,
              ),
              ends_at: toISOStringOrNull(
                form.ends_at,
              ),
              minimum_purchase: minimumPurchase,
            };

      const response = await fetch(
        isEditing
          ? `/api/admin/promotions/${editingPromotion?.id}`
          : "/api/admin/promotions",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudo guardar la promoción.",
        );
      }

      const promotionId =
        editingPromotion?.id ?? result.promotion?.id;

      if (!promotionId) {
        throw new Error(
          "La promoción se guardó, pero no se recibió su identificador.",
        );
      }

      await syncPromotionProducts(promotionId);

      setSuccess(
        isEditing
          ? "Promoción actualizada correctamente."
          : "Promoción creada correctamente.",
      );

      setForm(initialForm);
      setSelectedProducts([]);
      setEditingPromotion(null);

      await loadPromotions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la promoción.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(
    promotion: Promotion,
  ) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/promotions/${promotion.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !promotion.is_active,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "No se pudo cambiar el estado de la promoción.",
        );
      }

      setSuccess(
        promotion.is_active
          ? "Promoción desactivada correctamente."
          : "Promoción activada correctamente.",
      );

      await loadPromotions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado de la promoción.",
      );
    }
  }

  const selectedProductIds = new Set(
    selectedProducts.map((item) => item.productId),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingPromotion
              ? "Editar promoción"
              : "Nueva promoción"}
          </CardTitle>

          <p className="text-text-secondary">
            Configura promociones directamente sobre productos
            o crea combos con un precio final.
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nombre">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value,
                    )
                  }
                  maxLength={150}
                  disabled={saving}
                  required
                  placeholder="Ej. 20% en rosas rojas"
                />
              </Field>

              <Field label="Tipo de promoción">
                <select
                  value={form.promotion_type}
                  onChange={(event) => {
                    const value =
                      event.target.value as PromotionType;

                    updateForm(
                      "promotion_type",
                      value,
                    );

                    setSelectedProducts(
                      (current) =>
                        current.map((item) => ({
                          ...item,
                          quantity: "1",
                        })),
                    );
                  }}
                  disabled={saving}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="producto">
                    Promoción de producto
                  </option>
                  <option value="combo">
                    Combo
                  </option>
                </select>
              </Field>
            </div>

            <Field label="Descripción" optional>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value,
                  )
                }
                maxLength={500}
                disabled={saving}
                rows={3}
                placeholder="Describe brevemente la promoción."
              />
            </Field>

            {form.promotion_type === "producto" ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Tipo de beneficio">
                  <select
                    value={form.discount_type}
                    onChange={(event) =>
                      updateForm(
                        "discount_type",
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="porcentaje">
                      Porcentaje
                    </option>
                    <option value="monto_fijo">
                      Monto fijo
                    </option>
                  </select>
                </Field>

                <Field
                  label={
                    form.discount_type ===
                    "porcentaje"
                      ? "Porcentaje de descuento"
                      : "Monto de descuento"
                  }
                >
                  <Input
                    type="number"
                    min="0"
                    step={
                      form.discount_type ===
                      "porcentaje"
                        ? "1"
                        : "0.01"
                    }
                    max={
                      form.discount_type ===
                      "porcentaje"
                        ? "100"
                        : undefined
                    }
                    value={form.discount_value}
                    onChange={(event) =>
                      updateForm(
                        "discount_value",
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    required
                    placeholder={
                      form.discount_type ===
                      "porcentaje"
                        ? "20"
                        : "10.00"
                    }
                  />
                </Field>
              </div>
            ) : (
              <div>
  <Field label="Precio final del combo">
    <Input
      type="number"
      min="0"
      step="0.01"
      value={form.combo_price}
      onChange={(event) =>
        updateForm(
          "combo_price",
          event.target.value,
        )
      }
      disabled={saving}
      required
      placeholder="Ej. 250.00"
    />
  </Field>

  <p className="mt-1 text-sm text-text-secondary">
    Este es el precio total que pagará el cliente por cada combo completo.
  </p>
</div>
            )}

            <Card className="border border-border-decorative shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Productos de la promoción
                </CardTitle>

                <p className="text-sm text-text-secondary">
                  {form.promotion_type === "combo"
                    ? "Selecciona los productos y define cuántas unidades de cada uno forman el combo."
                    : "Selecciona los productos a los que se aplicará esta promoción."}
                </p>
              </CardHeader>

              <CardContent>
                {productsLoading ? (
                  <p className="text-sm text-text-secondary">
                    Cargando productos...
                  </p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No hay productos disponibles.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {products.map((product) => {
                      const selected =
                        selectedProductIds.has(
                          product.id,
                        );

                      const selectedItem =
                        selectedProducts.find(
                          (item) =>
                            item.productId ===
                            product.id,
                        );

                      return (
                        <div
                          key={product.id}
                          className={`flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between ${
                            selected
                              ? "border-brand bg-brand/5"
                              : "border-border-decorative"
                          }`}
                        >
                          <label className="flex min-w-0 cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                toggleProduct(
                                  product.id,
                                )
                              }
                              disabled={saving}
                              className="size-4 accent-brand"
                            />

                            <div className="min-w-0">
                              <p className="font-medium text-text">
                                {product.name}
                              </p>

                              <p className="text-sm text-text-secondary">
                                {formatMoney(
                                  Number(
                                    product.price,
                                  ),
                                )}
                              </p>
                            </div>
                          </label>

                          {selected &&
                            form.promotion_type ===
                              "combo" && (
                              <div className="w-full md:w-32">
                                <label className="mb-1 block text-xs font-medium text-text-secondary">
                                  Cantidad
                                </label>

                                <Input
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  value={
                                    selectedItem
                                      ?.quantity ?? "1"
                                  }
                                  onChange={(event) =>
                                    updateProductQuantity(
                                      product.id,
                                      event.target.value,
                                    )
                                  }
                                  disabled={saving}
                                />
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Inicio" optional>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) =>
                    updateForm(
                      "starts_at",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                />
              </Field>

              <Field
                label="Finalización"
                optional
              >
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) =>
                    updateForm(
                      "ends_at",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                />
              </Field>

              <Field
                label="Compra mínima"
                optional
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimum_purchase}
                  onChange={(event) =>
                    updateForm(
                      "minimum_purchase",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="Ej. 100.00"
                />
              </Field>
            </div>

            {error && (
              <p className="text-sm text-danger">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-leaf">
                {success}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={saving}
                loadingText="Guardando…"
              >
                {editingPromotion
                  ? "Guardar cambios"
                  : "Crear promoción"}
              </Button>

              {editingPromotion && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 p-0">
        <div className="border-b border-border-decorative p-4">
          <h2 className="text-xl font-semibold text-text">
            Promociones
          </h2>

          <p className="text-text-secondary">
            Administra las promociones existentes y su
            estado.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-center text-text-secondary">
            Cargando promociones...
          </p>
        ) : promotions.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">
            No hay promociones registradas.
          </p>
        ) : (
          <div className="divide-y divide-border-decorative">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-text">
                      {promotion.name}
                    </h3>

                    <Badge
                      variant={
                        promotion.is_active
                          ? "brand"
                          : "outline"
                      }
                    >
                      {promotion.is_active
                        ? "Activa"
                        : "Inactiva"}
                    </Badge>

                    <Badge variant="outline">
                      {
                        promotionTypeLabels[
                          promotion.promotion_type
                        ]
                      }
                    </Badge>
                  </div>

                  {promotion.description && (
                    <p className="mt-2 text-sm text-text-secondary">
                      {promotion.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span>
                      <strong className="text-text">
                        {promotion.promotion_type ===
                        "combo"
                          ? "Precio del combo:"
                          : "Beneficio:"}
                      </strong>{" "}
                      <span className="text-text-secondary">
                        {formatDiscount(promotion)}
                        {promotion.promotion_type ===
                          "producto" &&
                          promotion.discount_type ===
                            "porcentaje" &&
                          " de descuento"}
                      </span>
                    </span>

                    <span>
                      <strong className="text-text">
                        Vigencia:
                      </strong>{" "}
                      <span className="text-text-secondary">
                        {formatDate(
                          promotion.starts_at,
                        )}{" "}
                        —{" "}
                        {formatDate(
                          promotion.ends_at,
                        )}
                      </span>
                    </span>

                    {promotion.minimum_purchase !==
                      null && (
                      <span>
                        <strong className="text-text">
                          Compra mínima:
                        </strong>{" "}
                        <span className="text-text-secondary">
                          {formatMoney(
                            Number(
                              promotion.minimum_purchase,
                            ),
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void startEditing(
                        promotion,
                      )
                    }
                    disabled={
                      associationLoading ||
                      saving
                    }
                  >
                    Editar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void togglePromotion(
                        promotion,
                      )
                    }
                    disabled={saving}
                  >
                    {promotion.is_active
                      ? "Desactivar"
                      : "Activar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}