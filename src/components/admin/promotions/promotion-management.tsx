"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  findCheapestProduct,
  findFixedDiscountViolation,
  fixedDiscountMessage,
} from "@/lib/promotions/fixed-discount";

/* ============================================================
   TIPOS
   ============================================================ */

type PromotionType = "producto" | "combo";
type DiscountType = "porcentaje" | "monto_fijo";

type PromotionItem = {
  product_id: string;
  quantity: number;
  product: { id: string; name: string; price: number } | null;
};

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
  items?: PromotionItem[] | null;
};

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  is_sold_out?: boolean;
};

type SelectedProduct = {
  productId: string;
  name: string;
  price: number;
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

const selectClassName =
  "flex h-11 w-full rounded-xl border border-border-field bg-surface px-3.5 text-base text-text outline-none transition-all focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const JSON_HEADERS = { "Content-Type": "application/json" };

/* ============================================================
   UTILIDADES
   ============================================================ */

type ApiResponse = {
  success?: boolean;
  message?: string;
};

/**
 * fetch + JSON + manejo de error en un solo lugar.
 * Lanza Error(message) si la respuesta no es exitosa.
 */
async function request<T extends object>(
  url: string,
  init: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });

  let result: (T & ApiResponse) | null = null;

  try {
    result = (await response.json()) as T & ApiResponse;
  } catch {
    result = null;
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || fallbackMessage);
  }

  return result;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatMoney(value: number) {
  return `Bs ${Number(value).toFixed(2)}`;
}

function formatPercent(value: number) {
  return `${Number(value)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatValidity(promotion: Promotion) {
  const { starts_at: start, ends_at: end } = promotion;

  if (!start && !end) return "Sin límite de fechas";
  if (start && !end) return `Desde ${formatDate(start)}`;
  if (!start && end) return `Hasta ${formatDate(end)}`;

  return `${formatDate(start as string)} — ${formatDate(end as string)}`;
}

function formatBenefit(promotion: Promotion) {
  if (promotion.promotion_type === "combo") {
    return promotion.combo_price !== null
      ? formatMoney(promotion.combo_price)
      : "Sin precio";
  }

  if (promotion.discount_type === "porcentaje") {
    return `${formatPercent(promotion.discount_value ?? 0)} de descuento`;
  }

  return formatMoney(promotion.discount_value ?? 0);
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function toISOStringOrNull(value: string) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Estado real de la promoción. "Activa" solo dice que el interruptor
 * está encendido: una promoción puede estar encendida y ya vencida.
 */
function getStatus(promotion: Promotion, now: number) {
  if (!promotion.is_active) {
    return { label: "Inactiva", variant: "outline" as const };
  }

  if (promotion.starts_at && Date.parse(promotion.starts_at) > now) {
    return { label: "Programada", variant: "outline" as const };
  }

  if (promotion.ends_at && Date.parse(promotion.ends_at) < now) {
    return { label: "Vencida", variant: "outline" as const };
  }

  return { label: "Vigente", variant: "brand" as const };
}

function describeItems(promotion: Promotion) {
  const items = promotion.items ?? [];

  if (items.length === 0) return null;

  const names = items.map((item) => {
    const name = item.product?.name ?? "Producto";

    return promotion.promotion_type === "combo"
      ? `${Number(item.quantity)}× ${name}`
      : name;
  });

  const visible = names.slice(0, 4).join(
    promotion.promotion_type === "combo" ? " + " : ", ",
  );

  return names.length > 4
    ? `${visible} y ${names.length - 4} más`
    : visible;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function PromotionManagement({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  // Lista de promociones
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [now, setNow] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Catálogo para elegir productos
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [search, setSearch] = useState("");

  // Formulario
  const [form, setForm] = useState<PromotionForm>(initialForm);
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [editingPromotion, setEditingPromotion] =
    useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Mensaje del botón Activar/Desactivar: aparece junto a la lista.
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  /* ----------------------------- carga ----------------------------- */

  const loadPromotions = useCallback(async () => {
    try {
      const result = await request<{ promotions: Promotion[] }>(
        "/api/admin/promotions",
        undefined,
        "No se pudieron cargar las promociones.",
      );

      setPromotions(result.promotions ?? []);
      setNow(Date.now());
      setListError("");
    } catch (error) {
      setListError(
        errorMessage(error, "No se pudieron cargar las promociones."),
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadPromotions();
    })();
  }, [loadPromotions]);

  // Búsqueda de productos en el servidor (con espera de 300 ms al escribir).
  useEffect(() => {
    if (!isAdmin) return;

    const term = search.trim();
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          const params = new URLSearchParams({
            limit: "60",
            page: "1",
            sort: "name",
            order: "asc",
          });

          if (term) params.set("search", term);

          const result = await request<{
            products: CatalogProduct[];
            pagination?: { total?: number };
          }>(
            `/api/products?${params.toString()}`,
            undefined,
            "No se pudieron cargar los productos.",
          );

          if (cancelled) return;

          setCatalog(result.products ?? []);
          setCatalogTotal(
            result.pagination?.total ?? result.products?.length ?? 0,
          );
          setCatalogError("");
        } catch (error) {
          if (cancelled) return;

          setCatalogError(
            errorMessage(error, "No se pudieron cargar los productos."),
          );
        } finally {
          if (!cancelled) setCatalogLoading(false);
        }
      },
      term ? 300 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, isAdmin]);

  /* ---------------------------- formulario ---------------------------- */

  function updateForm(field: keyof PromotionForm, value: string) {
    // Al corregir un campo, el mensaje de error anterior ya no aplica.
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelected([]);
    setEditingPromotion(null);
    setError("");
  }

  function changeType(value: PromotionType) {
    updateForm("promotion_type", value);

    // Las cantidades solo tienen sentido en combos.
    setSelected((current) =>
      current.map((item) => ({ ...item, quantity: "1" })),
    );
  }

  function toggleProduct(product: CatalogProduct) {
    setError("");
    setSelected((current) =>
      current.some((item) => item.productId === product.id)
        ? current.filter((item) => item.productId !== product.id)
        : [
            ...current,
            {
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              quantity: "1",
            },
          ],
    );
  }

  function removeProduct(productId: string) {
    setError("");
    setSelected((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }

  function updateQuantity(productId: string, quantity: string) {
    setError("");
    setSelected((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function startEditing(promotion: Promotion) {
    setEditingPromotion(promotion);

    setForm({
      name: promotion.name,
      description: promotion.description ?? "",
      promotion_type: promotion.promotion_type,
      discount_type: promotion.discount_type ?? "porcentaje",
      discount_value:
        promotion.discount_value !== null
          ? String(promotion.discount_value)
          : "",
      combo_price:
        promotion.combo_price !== null ? String(promotion.combo_price) : "",
      starts_at: toDateTimeLocal(promotion.starts_at),
      ends_at: toDateTimeLocal(promotion.ends_at),
      minimum_purchase:
        promotion.minimum_purchase !== null
          ? String(promotion.minimum_purchase)
          : "",
    });

    setSelected(
      (promotion.items ?? []).map((item) => ({
        productId: item.product_id,
        name: item.product?.name ?? "Producto",
        price: Number(item.product?.price ?? 0),
        quantity: String(Number(item.quantity)),
      })),
    );

    setError("");
    setSuccess("");
    setNotice(null);

    // La lista queda debajo del formulario: se sube a él para que
    // el clic en "Editar" tenga un efecto visible.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    formRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    nameRef.current?.focus({ preventScroll: true });
  }

  /* --------------------- sincronizar productos --------------------- */

  async function syncPromotionProducts(
    promotionId: string,
    items: SelectedProduct[],
    type: PromotionType,
  ) {
    const base = `/api/admin/promotions/${promotionId}/products`;

    const current = await request<{
      products: { product_id: string; quantity: number }[];
    }>(
      base,
      undefined,
      "No se pudieron consultar los productos de la promoción.",
    );

    const currentQuantities = new Map(
      (current.products ?? []).map((item) => [
        item.product_id,
        Number(item.quantity),
      ]),
    );

    // 1) Agregar y actualizar primero: si algo falla, la promoción
    //    sigue teniendo los productos que ya tenía.
    for (const item of items) {
      const quantity = type === "combo" ? Number(item.quantity) : 1;
      const existing = currentQuantities.get(item.productId);

      if (existing === undefined) {
        await request(
          base,
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ product_id: item.productId, quantity }),
          },
          `No se pudo agregar «${item.name}» a la promoción.`,
        );
      } else if (existing !== quantity) {
        await request(
          `${base}/${item.productId}`,
          {
            method: "PATCH",
            headers: JSON_HEADERS,
            body: JSON.stringify({ quantity }),
          },
          `No se pudo actualizar la cantidad de «${item.name}».`,
        );
      }
    }

    // 2) Quitar al final los que ya no están seleccionados.
    const selectedIds = new Set(items.map((item) => item.productId));

    for (const productId of currentQuantities.keys()) {
      if (!selectedIds.has(productId)) {
        await request(
          `${base}/${productId}`,
          { method: "DELETE" },
          "No se pudo quitar un producto de la promoción.",
        );
      }
    }
  }

  /* ----------------------------- guardar ----------------------------- */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setNotice(null);

    const name = form.name.trim();
    const description = form.description.trim();
    const isCombo = form.promotion_type === "combo";

    if (!name) {
      setError("El nombre de la promoción es obligatorio.");
      return;
    }

    if (selected.length === 0) {
      setError(
        isCombo
          ? "Selecciona al menos un producto para el combo."
          : "Selecciona al menos un producto para la promoción.",
      );
      return;
    }

    let discountValue: number | null = null;
    let comboPrice: number | null = null;

    if (isCombo) {
      comboPrice = Number(form.combo_price);

      if (!form.combo_price.trim() || !Number.isFinite(comboPrice) || comboPrice <= 0) {
        setError("El precio del combo debe ser mayor que cero.");
        return;
      }

      for (const item of selected) {
        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          setError(`La cantidad de «${item.name}» debe ser mayor que cero.`);
          return;
        }
      }
    } else {
      discountValue = Number(form.discount_value);

      if (
        !form.discount_value.trim() ||
        !Number.isFinite(discountValue) ||
        discountValue <= 0
      ) {
        setError("El valor del descuento debe ser mayor que cero.");
        return;
      }

      if (form.discount_type === "porcentaje" && discountValue > 100) {
        setError("El porcentaje de descuento no puede superar el 100%.");
        return;
      }

      // Monto fijo: no puede superar el precio del producto más barato.
      if (form.discount_type === "monto_fijo") {
        const violation = findFixedDiscountViolation(discountValue, selected);

        if (violation) {
          setError(fixedDiscountMessage(discountValue, violation));
          return;
        }
      }
    }

    const minimumPurchase = form.minimum_purchase.trim()
      ? Number(form.minimum_purchase)
      : null;

    if (
      minimumPurchase !== null &&
      (!Number.isFinite(minimumPurchase) || minimumPurchase < 0)
    ) {
      setError("La compra mínima no es válida.");
      return;
    }

    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.starts_at) >= new Date(form.ends_at)
    ) {
      setError(
        "La fecha de finalización debe ser posterior a la fecha de inicio.",
      );
      return;
    }

    const common = {
      name,
      description: description || null,
      starts_at: toISOStringOrNull(form.starts_at),
      ends_at: toISOStringOrNull(form.ends_at),
      minimum_purchase: minimumPurchase,
    };

    const benefit = isCombo
      ? { combo_price: comboPrice }
      : { discount_type: form.discount_type, discount_value: discountValue };

    const wasEditing = Boolean(editingPromotion);
    let createdNow = false;

    try {
      setSaving(true);

      let promotionId: string;

      if (editingPromotion) {
        promotionId = editingPromotion.id;

        // El tipo no se envía: es permanente.
        const savePromotion = () =>
          request(
            `/api/admin/promotions/${promotionId}`,
            {
              method: "PATCH",
              headers: JSON_HEADERS,
              body: JSON.stringify({ ...common, ...benefit }),
            },
            "No se pudo guardar la promoción.",
          );

        // El servidor comprueba que el monto fijo no supere el precio de
        // los productos que la promoción tiene en ese momento. Si el monto
        // SUBE, primero se actualizan los productos (así ya no están los
        // que quedarían por debajo); si baja o no cambia, primero el monto.
        const raisesFixedDiscount =
          !isCombo &&
          form.discount_type === "monto_fijo" &&
          (editingPromotion.discount_type !== "monto_fijo" ||
            (discountValue ?? 0) > Number(editingPromotion.discount_value ?? 0));

        if (raisesFixedDiscount) {
          await syncPromotionProducts(promotionId, selected, form.promotion_type);
          await savePromotion();
        } else {
          await savePromotion();
          await syncPromotionProducts(promotionId, selected, form.promotion_type);
        }
      } else {
        const created = await request<{ promotion: Promotion }>(
          "/api/admin/promotions",
          {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({
              ...common,
              ...benefit,
              promotion_type: form.promotion_type,
            }),
          },
          "No se pudo crear la promoción.",
        );

        promotionId = created.promotion.id;
        createdNow = true;

        // Desde aquí el formulario pasa a "editar": si guardar los
        // productos falla, reintentar NO crea una promoción duplicada.
        setEditingPromotion({ ...created.promotion, items: [] });

        await syncPromotionProducts(promotionId, selected, form.promotion_type);
      }

      setSuccess(
        wasEditing
          ? "Promoción actualizada correctamente."
          : "Promoción creada correctamente.",
      );

      setForm(initialForm);
      setSelected([]);
      setEditingPromotion(null);

      await loadPromotions();
    } catch (error) {
      const message = errorMessage(error, "No se pudo guardar la promoción.");

      setError(
        createdNow
          ? `La promoción se creó, pero no se pudieron guardar sus productos: ${message} Revisa la selección y pulsa «Guardar cambios» para reintentar.`
          : message,
      );

      if (createdNow) await loadPromotions();
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(promotion: Promotion) {
    setNotice(null);

    try {
      await request(
        `/api/admin/promotions/${promotion.id}`,
        {
          method: "PATCH",
          headers: JSON_HEADERS,
          body: JSON.stringify({ is_active: !promotion.is_active }),
        },
        "No se pudo cambiar el estado de la promoción.",
      );

      setNotice({
        kind: "success",
        text: promotion.is_active
          ? `«${promotion.name}» se desactivó correctamente.`
          : `«${promotion.name}» se activó correctamente.`,
      });

      await loadPromotions();
    } catch (error) {
      setNotice({
        kind: "error",
        text: errorMessage(
          error,
          "No se pudo cambiar el estado de la promoción.",
        ),
      });
    }
  }

  /* ------------------------------ vista ------------------------------ */

  const isCombo = form.promotion_type === "combo";
  const selectedIds = new Set(selected.map((item) => item.productId));

  const comboNormalPrice = selected.reduce(
    (sum, item) => sum + item.price * (Number(item.quantity) || 0),
    0,
  );
  const comboPriceNumber = Number(form.combo_price);

  // Monto fijo: máximo permitido = precio del producto más barato elegido.
  const isFixedDiscount = !isCombo && form.discount_type === "monto_fijo";
  const cheapestSelected = isFixedDiscount
    ? findCheapestProduct(selected)
    : null;
  const fixedDiscountNumber = Number(form.discount_value);
  const fixedDiscountViolation =
    isFixedDiscount &&
    form.discount_value.trim() !== "" &&
    Number.isFinite(fixedDiscountNumber)
      ? findFixedDiscountViolation(fixedDiscountNumber, selected)
      : null;
  const showComboSummary =
    isCombo && selected.length > 0 && comboNormalPrice > 0;

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && (
        <div ref={formRef} className="scroll-mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingPromotion ? "Editar promoción" : "Nueva promoción"}
              </CardTitle>

              <p className="text-text-secondary">
                Configura promociones directamente sobre productos o crea
                combos con un precio final.
              </p>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nombre">
                    <Input
                      ref={nameRef}
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      maxLength={150}
                      disabled={saving}
                      required
                      placeholder="Ej. 20% en rosas rojas"
                    />
                  </Field>

                  <Field
                    label="Tipo de promoción"
                    hint={
                      editingPromotion
                        ? "El tipo no se puede cambiar después de crear la promoción."
                        : undefined
                    }
                  >
                    <select
                      value={form.promotion_type}
                      onChange={(event) =>
                        changeType(event.target.value as PromotionType)
                      }
                      disabled={saving || Boolean(editingPromotion)}
                      className={selectClassName}
                    >
                      <option value="producto">Promoción de producto</option>
                      <option value="combo">Combo</option>
                    </select>
                  </Field>
                </div>

                <Field label="Descripción" optional>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    maxLength={500}
                    disabled={saving}
                    rows={3}
                    placeholder="Describe brevemente la promoción."
                  />
                </Field>

                {isCombo ? (
                  <Field
                    label="Precio final del combo"
                    hint="Es el precio total que pagará el cliente por cada combo completo."
                  >
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={form.combo_price}
                      onChange={(event) =>
                        updateForm("combo_price", event.target.value)
                      }
                      disabled={saving}
                      required
                      placeholder="Ej. 250.00"
                    />
                  </Field>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Tipo de beneficio">
                      <select
                        value={form.discount_type}
                        onChange={(event) =>
                          updateForm("discount_type", event.target.value)
                        }
                        disabled={saving}
                        className={selectClassName}
                      >
                        <option value="porcentaje">Porcentaje</option>
                        <option value="monto_fijo">Monto fijo</option>
                      </select>
                    </Field>

                    <Field
                      label={
                        form.discount_type === "porcentaje"
                          ? "Porcentaje de descuento"
                          : "Monto de descuento"
                      }
                      hint={
                        isFixedDiscount
                          ? cheapestSelected
                            ? `Máximo permitido: ${formatMoney(cheapestSelected.price)} (precio de «${cheapestSelected.name}», el producto más barato seleccionado).`
                            : "Selecciona productos para ver el máximo permitido."
                          : undefined
                      }
                      error={
                        fixedDiscountViolation
                          ? fixedDiscountMessage(
                              fixedDiscountNumber,
                              fixedDiscountViolation,
                            )
                          : undefined
                      }
                    >
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        max={form.discount_type === "porcentaje" ? "100" : undefined}
                        value={form.discount_value}
                        onChange={(event) =>
                          updateForm("discount_value", event.target.value)
                        }
                        disabled={saving}
                        required
                        placeholder={
                          form.discount_type === "porcentaje" ? "20" : "10.00"
                        }
                      />
                    </Field>
                  </div>
                )}

                {/* ------------------ Productos ------------------ */}

                <Card className="border border-border-decorative shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Productos de la promoción
                    </CardTitle>

                    <p className="text-sm text-text-secondary">
                      {isCombo
                        ? "Elige los productos y cuántas unidades de cada uno forman el combo."
                        : "Elige los productos a los que se aplicará esta promoción."}
                    </p>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4">
                    {selected.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        {selected.map((item) => (
                          <li
                            key={item.productId}
                            className="flex flex-wrap items-center gap-3 rounded-lg border border-brand bg-brand/5 p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-text">
                                {item.name}
                              </p>
                              <p className="text-sm text-text-secondary">
                                {formatMoney(item.price)}
                              </p>
                            </div>

                            {isCombo && (
                              <div className="w-28">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  aria-label={`Cantidad de ${item.name} en el combo`}
                                  min="0.001"
                                  step="0.001"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateQuantity(
                                      item.productId,
                                      event.target.value,
                                    )
                                  }
                                  disabled={saving}
                                />
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Quitar ${item.name}`}
                              onClick={() => removeProduct(item.productId)}
                              disabled={saving}
                            >
                              <X aria-hidden="true" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {showComboSummary && (
                      <p
                        className={`text-sm ${
                          Number.isFinite(comboPriceNumber) &&
                          comboPriceNumber >= comboNormalPrice &&
                          form.combo_price !== ""
                            ? "text-danger"
                            : "text-text-secondary"
                        }`}
                      >
                        Precio normal del combo: {formatMoney(comboNormalPrice)}
                        {form.combo_price !== "" &&
                          Number.isFinite(comboPriceNumber) &&
                          (comboPriceNumber < comboNormalPrice
                            ? ` · El cliente ahorra ${formatMoney(
                                comboNormalPrice - comboPriceNumber,
                              )} por combo.`
                            : " · El precio del combo no es menor que comprar por separado: no habrá descuento.")}
                      </p>
                    )}

                    <Field label="Buscar productos" optional>
                      <Input
                        type="search"
                        value={search}
                        onChange={(event) => {
                          setCatalogLoading(true);
                          setSearch(event.target.value);
                        }}
                        placeholder="Escribe parte del nombre"
                        disabled={saving}
                      />
                    </Field>

                    {catalogError ? (
                      <p role="alert" className="text-sm text-danger">
                        {catalogError}
                      </p>
                    ) : catalogLoading ? (
                      <p className="text-sm text-text-secondary">
                        Cargando productos...
                      </p>
                    ) : catalog.length === 0 ? (
                      <p className="text-sm text-text-secondary">
                        {search.trim()
                          ? "Ningún producto coincide con la búsqueda."
                          : "No hay productos disponibles."}
                      </p>
                    ) : (
                      <>
                        <ul
                          className="max-h-72 divide-y divide-border-decorative overflow-y-auto rounded-lg border border-border-decorative"
                          aria-label="Resultados de productos"
                        >
                          {catalog.map((product) => (
                            <li key={product.id}>
                              <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-brand/5">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(product.id)}
                                  onChange={() => toggleProduct(product)}
                                  disabled={saving}
                                  className="size-5 shrink-0 accent-brand"
                                />

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-medium text-text">
                                    {product.name}
                                  </span>
                                  <span className="block text-sm text-text-secondary">
                                    {formatMoney(Number(product.price))}
                                    {product.is_sold_out ? " · Agotado" : ""}
                                  </span>
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>

                        {catalogTotal > catalog.length && (
                          <p className="text-sm text-text-secondary">
                            Mostrando {catalog.length} de {catalogTotal}{" "}
                            productos. Usa el buscador para encontrar otros.
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-5 md:grid-cols-3">
                  <Field label="Inicio" optional>
                    <Input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(event) =>
                        updateForm("starts_at", event.target.value)
                      }
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Finalización" optional>
                    <Input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(event) =>
                        updateForm("ends_at", event.target.value)
                      }
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Compra mínima" optional>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={form.minimum_purchase}
                      onChange={(event) =>
                        updateForm("minimum_purchase", event.target.value)
                      }
                      disabled={saving}
                      placeholder="Ej. 100.00"
                    />
                  </Field>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                )}

                {success && (
                  <p role="status" className="text-sm text-leaf">
                    {success}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    loading={saving}
                    loadingText="Guardando…"
                  >
                    {editingPromotion ? "Guardar cambios" : "Crear promoción"}
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
        </div>
      )}

      {/* ------------------------ Lista ------------------------ */}

      <Card className="gap-0 p-0">
        <div className="border-b border-border-decorative p-4">
          <h2 className="text-xl font-semibold text-text">Promociones</h2>

          <p className="text-text-secondary">
            {isAdmin
              ? "Administra las promociones existentes y su estado."
              : "Promociones registradas en el sistema."}
          </p>
        </div>

        {notice && (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={`px-4 pt-4 text-sm ${
              notice.kind === "error" ? "text-danger" : "text-leaf"
            }`}
          >
            {notice.text}
          </p>
        )}

        {listLoading ? (
          <p className="p-6 text-center text-text-secondary">
            Cargando promociones...
          </p>
        ) : listError ? (
          <p role="alert" className="p-6 text-center text-danger">
            {listError}
          </p>
        ) : promotions.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">
            No hay promociones registradas.
          </p>
        ) : (
          <div className="divide-y divide-border-decorative">
            {promotions.map((promotion) => {
              const status = getStatus(promotion, now);
              const itemsText = describeItems(promotion);

              return (
                <div
                  key={promotion.id}
                  className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-text">
                        {promotion.name}
                      </h3>

                      <Badge variant={status.variant}>{status.label}</Badge>

                      <Badge variant="outline">
                        {promotionTypeLabels[promotion.promotion_type]}
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
                          {promotion.promotion_type === "combo"
                            ? "Precio del combo:"
                            : "Beneficio:"}
                        </strong>{" "}
                        <span className="text-text-secondary">
                          {formatBenefit(promotion)}
                        </span>
                      </span>

                      <span>
                        <strong className="text-text">Vigencia:</strong>{" "}
                        <span className="text-text-secondary">
                          {formatValidity(promotion)}
                        </span>
                      </span>

                      {promotion.minimum_purchase !== null && (
                        <span>
                          <strong className="text-text">Compra mínima:</strong>{" "}
                          <span className="text-text-secondary">
                            {formatMoney(promotion.minimum_purchase)}
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm">
                      <strong className="text-text">
                        {promotion.promotion_type === "combo"
                          ? "Incluye:"
                          : "Aplica a:"}
                      </strong>{" "}
                      {itemsText ? (
                        <span className="text-text-secondary">{itemsText}</span>
                      ) : (
                        <span className="text-danger">
                          Sin productos: no se podrá aplicar hasta que agregues
                          al menos uno.
                        </span>
                      )}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(promotion)}
                        disabled={saving}
                      >
                        Editar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void togglePromotion(promotion)}
                        disabled={
                          saving ||
                          (!promotion.is_active &&
                            (promotion.items ?? []).length === 0)
                        }
                      >
                        {promotion.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}