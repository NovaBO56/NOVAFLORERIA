"use client";

import { DedicationEditor } from "../dedication-card";
import { dedicationsSchema, hasDedication, resizeDedications, type Dedication } from "@/lib/public/dedications";
import { useEffect, useRef, useState } from "react";
import { SafeImage as Image } from "@/components/public/safe-image";
import { Heart, ShoppingBag } from "lucide-react";
import {
  formatMoney,
  initials,
  isPurchasable,
  promotionBenefit,
} from "@/lib/public/format";
import { MAX_QUANTITY } from "@/lib/public/cart-logic";
import type { CustomizationOption, ProductDetail, PublicProduct, PublicPromotion } from "@/lib/public/types";
import { script } from "./shared";
import { ComboProgress } from "../combo-progress";
import { ShoppingNotice } from "../shopping-notice";
import { useCart } from "./cart";

type DetailState = { id: string; data: ProductDetail | null } | null;

type ProductDetailSectionProps = {
  product: PublicProduct;
  categoryName: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAdd: (quantity: number, options: CustomizationOption[], message: string, dedications?: Dedication[], cardQuantity?: number) => void | boolean;
  requiredQuantity?: number;
  actionLabel?: string;
  promotion?: PublicPromotion;
  comboGuide?: { step: number; total: number; cancel: () => void };
  error?: string;
  embedded?: boolean;
  hideFavorite?: boolean;
};

/**
 * Detalle del producto seleccionado. El componente se monta con
 * `key={product.id}` desde el padre, así la cantidad y la imagen
 * activa se reinician solas al cambiar de producto.
 */
export function ProductDetailSection({
  product,
  categoryName,
  isFavorite,
  onToggleFavorite,
  onAdd,
  requiredQuantity,
  actionLabel,
  promotion,
  comboGuide,
  error,
  embedded = false,
  hideFavorite = false,
}: ProductDetailSectionProps) {
  const cart = useCart();
  const [detail, setDetail] = useState<DetailState>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [quantity, setQuantity] = useState(requiredQuantity ?? 1);
  const adding = useRef(false);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // La lista trae lo básico; descripción e ingredientes vienen del detalle.
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          success?: boolean;
          product?: ProductDetail;
        };

        if (cancelled) return;

        setDetail({
          id: product.id,
          data: response.ok && result.success ? (result.product ?? null) : null,
        });
      } catch {
        if (!cancelled) setDetail({ id: product.id, data: null });
      }
    };
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState !== "hidden") void refresh(); }, 30_000);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [product.id]);

  const loadingDetail = detail?.id !== product.id;
  const full = detail?.id === product.id ? detail.data : null;

  const cardQuantity = (full?.dedication_card_quantity ?? 0) + (full?.customization_options ?? []).filter(option => selectedOptions.includes(option.id)).reduce((sum, option) => sum + (option.dedication_card_quantity ?? 0), 0);
  const images = (full?.images?.length ? full.images : product.images) ?? [];
  const current = images[activeImage] ?? images[0] ?? null;

  const purchasable = isPurchasable(full ?? product) && quantity <= (full?.available_quantity ?? MAX_QUANTITY);

  async function addSelection() {
    if (adding.current || !full) return;
    const cards = dedicationsSchema.safeParse(resizeDedications(dedications, quantity * cardQuantity));
    if (!cards.success) { setAvailabilityError(cards.error.issues[0]?.message || "Revisa tus tarjetas."); return; }
    if (quantity * cardQuantity > 198 && hasDedication(dedications)) {
      setAvailabilityError("Para conservar tus dedicatorias, elige una cantidad menor o quita los mensajes de esta selección."); return;
    }
    adding.current = true; setChecking(true); setAvailabilityError("");
    try {
      if (process.env.NEXT_PUBLIC_NOVA_VISUAL_PREVIEW !== "true") {
        const items = [...cart.items.map(item => ({ product_id:item.id.split(":")[0], quantity:item.quantity, customization_option_ids:item.options?.map(option=>option.id) ?? [] })), { product_id: product.id, quantity, customization_option_ids: selectedOptions }];
        if (items.length > 50) { setAvailabilityError("Tu carrito ya tiene el máximo de líneas. Revisa el carrito antes de agregar otro detalle."); return; }
        const response = await fetch("/api/products/availability", { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ items, combine:true }) });
        const result = await response.json();
        if (!response.ok || !result.availability?.length || result.availability.some((item: {is_available:boolean})=>!item.is_available)) {
          setAvailabilityError(response.ok ? "No hay existencias suficientes para esta selección junto con tu carrito. Revisa las cantidades o elige otro detalle." : "No pudimos comprobar la disponibilidad. Intenta nuevamente."); return;
        }
      }
      if (onAdd(quantity, full.customization_options?.filter(option => selectedOptions.includes(option.id)) ?? [], "", cardQuantity && quantity * cardQuantity <= 198 ? resizeDedications(dedications, quantity * cardQuantity) : undefined, cardQuantity) !== false) setAdded(true);
    } catch { setAvailabilityError("No pudimos comprobar la disponibilidad. Intenta nuevamente."); }
    finally { setChecking(false); adding.current = false; window.setTimeout(() => setAdded(false), 700); }
  }

  const includes = (full?.components ?? [])
    .map((entry) =>
      entry.component_product
        ? `${Number(entry.quantity)} × ${entry.component_product.name}`
        : null,
    )
    .filter((text): text is string => Boolean(text));

  return (
    <section
      id={embedded ? undefined : "detalle"}
      className={embedded ? "min-w-0 bg-white py-2" : "nova-enter scroll-mt-20 border-y border-[#e8e0ea] bg-white px-5 py-16 sm:px-8 sm:py-20"}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className={embedded ? "hidden" : "mb-8"}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
            Vista de producto
          </p>

          <h2
            className={`${script.className} mt-2 text-[50px] leading-none text-[#4c285f]`}
          >
            Detalle
          </h2>
        </div>

        {comboGuide && <ComboProgress step={comboGuide.step} total={comboGuide.total} product={product} quantity={requiredQuantity ?? 1} name={promotion?.name} onCancel={comboGuide.cancel}/>}
        {error && <div className="mb-6"><ShoppingNotice tone="error">{error}</ShoppingNotice></div>}
        <div className="grid min-w-0 gap-8 [overflow-wrap:anywhere] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
          <div
            className={`grid gap-4 ${
              images.length > 1 ? "grid-cols-[84px_minmax(0,1fr)]" : "grid-cols-1"
            }`}
          >
            {images.length > 1 ? (
              <div className="space-y-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                    aria-pressed={index === activeImage}
                    className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-[#ead9df] ${
                      index === activeImage
                        ? "border-2 border-[#65358e]"
                        : "border border-[#ded2e2]"
                    }`}
                  >
                    <Image
                      src={image.public_url}
                      alt=""
                      fill
                      sizes="84px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#ead9df]">
              {current ? (
                <Image
                  key={current.id}
                  src={current.public_url}
                  alt={current.alt_text ?? product.name}
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="nova-fade object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="flex size-[55%] items-center justify-center rounded-full border border-white/60 bg-white/20">
                    <span className={`${script.className} text-7xl text-[#76547f]`}>
                      {initials(product.name)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            {categoryName ? (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#78657f]">
                {categoryName}
              </span>
            ) : null}

            <h3
              className={`${script.className} mt-3 break-words text-[55px] leading-none text-[#4c285f]`}
            >
              {product.name}
            </h3>

            <p key={product.price} className="nova-value mt-5 text-2xl font-black text-[#65358e]">
              {formatMoney(product.price)}
            </p>

            {loadingDetail ? (
              <div className="mt-5 space-y-2" aria-busy="true">
                <div className="h-3 w-full max-w-[480px] animate-pulse rounded bg-[#eee5f0]" />
                <div className="h-3 w-4/5 max-w-[400px] animate-pulse rounded bg-[#eee5f0]" />
              </div>
            ) : full?.description ? (
              <p className="mt-5 max-w-[480px] text-sm leading-7 text-[#6a5e6e]">
                {full.description}
              </p>
            ) : null}

            {includes.length > 0 ? (
              <p className="mt-4 max-w-[480px] text-sm leading-6 text-[#6a5e6e]">
                <span className="font-black text-[#5b4d60]">Incluye:</span>{" "}
                {includes.join(", ")}
              </p>
            ) : null}

            <div className="mt-7 border-y border-[#e9e1eb] py-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#5b4d60]">
                Cantidad
              </p>

              <div className="mt-3 inline-flex items-center rounded-xl border border-[#ded2e2]">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1 || requiredQuantity !== undefined}
                  className="flex size-11 items-center justify-center text-[#5c4e61] disabled:opacity-40"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>

                <span
                  key={quantity}
                  className="nova-value flex size-11 items-center justify-center border-x border-[#ded2e2] text-sm font-black"
                  aria-live="polite"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))
                  }
                  disabled={quantity >= MAX_QUANTITY || requiredQuantity !== undefined}
                  className="flex size-11 items-center justify-center text-[#5c4e61] disabled:opacity-40"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {promotion && <div className="customer-note" role="status"><strong>{promotion.name}</strong><p>{promotionBenefit(promotion)}. Personaliza tu producto; el carrito aplicará el beneficio cuando cumpla todas las condiciones.</p></div>}
              {full?.customization_options?.map(option => <label key={option.id} className="nova-option flex items-center gap-3 rounded-lg text-sm"><input type="checkbox" checked={selectedOptions.includes(option.id)} onChange={event => setSelectedOptions(ids => event.target.checked ? [...ids, option.id] : ids.filter(id => id !== option.id))} />{option.name}: {option.value} (+{formatMoney(option.extra_price)})</label>)}
              <DedicationEditor count={quantity * cardQuantity} value={dedications} onChange={setDedications}/>
              {hasDedication(dedications.slice(quantity * cardQuantity)) && <ShoppingNotice>La selección cambió. Las dedicatorias de las tarjetas que ya no están incluidas no se agregarán al pedido.</ShoppingNotice>}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void addSelection()}
                disabled={checking || added || !purchasable || loadingDetail || !full}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#65358e] px-3 py-3 sm:flex-1 text-sm font-black text-white transition hover:bg-[#572d7a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={17} />
                {purchasable
                  ? checking ? "Comprobando…" : added ? "Agregado" : actionLabel ?? "Agregar al carrito"
                  : quantity > (full?.available_quantity ?? MAX_QUANTITY) && Number(full?.available_quantity) > 0 ? "Elige una cantidad menor" : (full ?? product).is_sold_out
                    ? "Agotado"
                    : "No disponible"}
              </button>

              {availabilityError && <p className="customer-error" role="alert">{availabilityError}</p>}

              {!hideFavorite && <button
                type="button"
                onClick={onToggleFavorite}
                aria-pressed={isFavorite}
                className="flex h-12 items-center justify-center rounded-xl border border-[#d8cadd] px-5 text-[#65358e] transition hover:bg-[#f5eff7]"
                aria-label={
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }
              >
                <Heart key={String(isFavorite)} size={18} className={isFavorite ? "nova-favorite fill-current text-[#a14370]" : "text-[#a14370]"} />
              </button>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
