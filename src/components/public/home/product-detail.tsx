"use client";

import { DedicationEditor } from "../dedication-card";
import { dedicationsSchema, hasDedication, resizeDedications, type Dedication } from "@/lib/public/dedications";
import { useEffect, useRef, useState } from "react";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { Heart, ShoppingBag } from "lucide-react";
import {
  formatMoney,
  isPurchasable,
  promotionBenefit,
} from "@/lib/public/format";
import { MAX_QUANTITY } from "@/lib/public/cart-logic";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import type { CustomizationOption, ProductDetail, PublicProduct, PublicPromotion } from "@/lib/public/types";
import { pickImage } from "@/lib/public/format";
import { promotionIsCurrent } from "@/lib/public/promotion-shopping";
import { selectPromotion, usePromotionSelection } from "@/lib/public/promotion-selection";
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
  const selectedPromotionId = usePromotionSelection();
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

  const includes = (full?.components ?? []).flatMap(entry => entry.component_product ? [{ id: entry.id, name: entry.component_product.name, quantity: Number(entry.quantity), image: pickImage(entry.component_product) }] : []);
  const selectedOffer = promotion && (comboGuide || selectedPromotionId === promotion.id) && promotion.products?.some(line => line.product_id === product.id) && promotionIsCurrent(promotion) ? promotion : null;
  function clearOffer() { comboGuide?.cancel(); selectPromotion(""); }

  return (
    <section
      id={embedded ? undefined : "detalle"}
      className={embedded ? "public-quick-detail min-w-0 bg-white py-2" : "nova-enter scroll-mt-20 border-y border-[#eadcdd] bg-white px-5 py-16 sm:px-8 sm:py-20"}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className={embedded ? "hidden" : "mb-8"}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b5965]">
            Vista de producto
          </p>

          <h2
            className="mt-2 text-3xl font-semibold tracking-tight text-[#392b38]"
          >
            Detalle
          </h2>
        </div>

        {comboGuide && <ComboProgress step={comboGuide.step} total={comboGuide.total} product={product} quantity={requiredQuantity ?? 1} name={promotion?.name} onCancel={comboGuide.cancel}/>}
        {error && <div className="mb-6"><ShoppingNotice tone="error">{friendlyErrorMessage(error)}</ShoppingNotice></div>}
        <div className="public-product-detail-grid grid min-w-0 gap-6 [overflow-wrap:anywhere] md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <div
            className={`public-product-gallery grid min-w-0 content-start gap-3 ${
              images.length > 1 ? "grid-cols-1 md:grid-cols-[52px_minmax(0,1fr)]" : "grid-cols-1"
            }`}
          >
            {images.length > 1 ? (
              <div className="order-2 flex gap-3 overflow-x-auto pb-1 md:order-none md:block md:space-y-3 md:overflow-visible md:pb-0">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                    aria-pressed={index === activeImage}
                    className={`relative block aspect-square w-14 shrink-0 overflow-hidden rounded-xl bg-[#f5eeea] md:w-full ${
                      index === activeImage
                        ? "border-2 border-[#873c58]"
                        : "border border-[#e6d7d8]"
                    }`}
                  >
                    <ProductThumbnail src={image.public_url} alt={image.alt_text ?? product.name} sizes="56px" className="absolute inset-0 size-full rounded-none border-0" voice="public"/>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="public-product-image relative order-1 aspect-square overflow-hidden rounded-2xl bg-[#f5eeea] md:order-none">
              <ProductThumbnail key={current?.id ?? "empty"} src={current?.public_url} alt={current?.alt_text ?? product.name} fit="contain" sizes="(min-width: 1024px) 560px, 100vw" className="absolute inset-0 size-full rounded-none border-0" preview={Boolean(current)} voice="public"/>
            </div>
            <p className="order-3 col-span-full text-xs leading-5 text-[#6b5965] md:order-none">{current ? `Imagen ${images.indexOf(current) + 1} de ${images.length}. Toca la fotografía para ampliarla.` : "Este producto todavía no tiene fotografía."}</p>
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            {categoryName ? (
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6b5965]">
                {categoryName}
              </span>
            ) : null}

            <h3
              className="mt-3 break-words text-2xl font-semibold leading-tight tracking-tight text-[#392b38] sm:text-3xl"
            >
              {product.name}
            </h3>

            <p key={product.price} className="nova-value mt-5 text-2xl font-black text-[#873c58]">
              {formatMoney(product.price)}
            </p>

            {loadingDetail ? (
              <div className="mt-5 space-y-2" aria-busy="true">
                <div className="h-3 w-full max-w-[480px] animate-pulse rounded bg-[#f5eeea]" />
                <div className="h-3 w-4/5 max-w-[400px] animate-pulse rounded bg-[#f5eeea]" />
              </div>
            ) : full?.description ? (
              <p className="mt-5 max-w-[480px] text-sm leading-7 text-[#6b5965]">
                {full.description}
              </p>
            ) : null}

            {!loadingDetail && !full && <div className="mt-5"><ShoppingNotice tone="error">No pudimos cargar este detalle. Vuelve a abrir el producto para intentarlo de nuevo.</ShoppingNotice></div>}

            {includes.length > 0 ? (
              <div className="mt-4 max-w-full text-sm leading-6 text-[#6b5965]"><p className="font-black text-[#645460]">Incluye:</p><ul className="mt-2 flex flex-wrap gap-2">{includes.map(entry => <li key={entry.id} className="flex max-w-full items-center gap-2 rounded-xl border border-[#e6d7d8] bg-[#fff9f4] p-2"><ProductThumbnail src={entry.image?.public_url} alt={entry.image?.alt_text ?? entry.name} size="sm" voice="public"/><span className="min-w-0 break-words">{entry.quantity} × {entry.name}</span></li>)}</ul></div>
            ) : null}

            <div className="mt-7 border-y border-[#e9e1eb] py-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#645460]">
                Cantidad
              </p>

              <div className="mt-3 inline-flex items-center rounded-xl border border-[#e6d7d8]">
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
                  className="nova-value flex size-11 items-center justify-center border-x border-[#e6d7d8] text-sm font-black"
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
              {selectedOffer && <ShoppingNotice><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide">Promoción seleccionada</p><strong>{selectedOffer.name}</strong></div><div className="flex flex-wrap gap-3"><button type="button" onClick={clearOffer} className="min-h-11 font-bold underline underline-offset-4">Quitar</button><a href="#catalogo-promociones" onClick={clearOffer} className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">Cambiar</a></div></div><p className="mt-2 font-bold">{promotionBenefit(selectedOffer)}</p>{Number(selectedOffer.minimum_purchase) > 0 && <p>Compra mínima: {formatMoney(selectedOffer.minimum_purchase!)}.</p>}{selectedOffer.promotion_type === "combo" && <p>Elige todos los productos y cantidades del combo. Los extras se cobran aparte.</p>}<p className="mt-2">Esta promoción se aplicará si tu pedido cumple las condiciones. Tu descuento se confirmará antes de finalizar el pedido.</p></ShoppingNotice>}
              {full?.customization_options?.map(option => <label key={option.id} className="nova-option flex items-center gap-3 rounded-lg text-sm"><input type="checkbox" checked={selectedOptions.includes(option.id)} onChange={event => setSelectedOptions(ids => event.target.checked ? [...ids, option.id] : ids.filter(id => id !== option.id))} />{option.name}: {option.value} (+{formatMoney(option.extra_price)})</label>)}
              <DedicationEditor count={quantity * cardQuantity} value={dedications} onChange={setDedications}/>
              {hasDedication(dedications.slice(quantity * cardQuantity)) && <ShoppingNotice>La selección cambió. Las dedicatorias de las tarjetas que ya no están incluidas no se agregarán al pedido.</ShoppingNotice>}
            </div>
            <div className="public-product-actions mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void addSelection()}
                disabled={checking || added || !purchasable || loadingDetail || !full}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#873c58] px-3 py-3 sm:flex-1 text-sm font-black text-white transition hover:bg-[#713048] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={17} />
                {purchasable
                  ? checking ? "Comprobando…" : added ? "Agregado" : actionLabel ?? "Agregar al carrito"
                  : quantity > (full?.available_quantity ?? MAX_QUANTITY) && Number(full?.available_quantity) > 0 ? "Elige una cantidad menor" : (full ?? product).is_sold_out
                    ? "Agotado"
                    : "No disponible"}
              </button>

              {availabilityError && <ShoppingNotice tone="error">{friendlyErrorMessage(availabilityError)}</ShoppingNotice>}

              {!hideFavorite && <button
                type="button"
                onClick={onToggleFavorite}
                aria-pressed={isFavorite}
                className="flex h-12 items-center justify-center rounded-xl border border-[#d9bfc6] px-5 text-[#873c58] transition hover:bg-[#fbf2ef]"
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
