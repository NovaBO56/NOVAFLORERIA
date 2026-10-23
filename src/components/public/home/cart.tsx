"use client";

import { DedicationEditor, DedicationPreview } from "../dedication-card";
import { dedicationsSchema, type Dedication } from "@/lib/public/dedications";
import { useEffect, useMemo, useState } from "react";
import { SafeImage as Image } from "@/components/public/safe-image";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShoppingBag, X } from "lucide-react";
import {
  addItem,
  MAX_QUANTITY,
  addCartBatch,
  buildOrderMessage,
  cartCount,
  cartTotal,
  changeItemQuantity,
  hasUnavailable,
  removeItem,
  sanitizeCart,
  type CartItem,
} from "@/lib/public/cart-logic";
import {
  formatMoney,
  isPurchasable,
  pickImage,
  whatsappLink,
} from "@/lib/public/format";
import { createLocalStore } from "@/lib/public/local-store";
import { selectPromotion, usePromotionSelection } from "@/lib/public/promotion-selection";
import { cartPromotion } from "@/lib/public/cart-promotions";
import { PromotionCartSummary } from "../promotion-cart-summary";
import { ShoppingNotice } from "../shopping-notice";
import type { CustomizationOption, ProductDetail, PublicProduct, PublicPromotion } from "@/lib/public/types";
import { script, useDialog } from "./shared";

/* ============================================================
   ALMACÉN DEL CARRITO (persiste en localStorage)
   ============================================================ */

const EMPTY_CART: CartItem[] = [];

const cartStore = createLocalStore<CartItem[]>({
  key: "nova-cart-v1",
  initial: EMPTY_CART,
  sanitize: sanitizeCart,
});

export function useCart() {
  const items = cartStore.useValue();

  return useMemo(
    () => ({
      items,
      count: cartCount(items),
      total: cartTotal(items),
      hasUnavailable: hasUnavailable(items),
    }),
    [items],
  );
}

export function clearCart() { cartStore.update(() => []); selectPromotion(""); }
export function updateCartDedications(id: string, dedications: Dedication[]) {
  cartStore.update(items => items.map(item => item.id === id ? { ...item, message: undefined, dedications } : item));
}
export function addComboToCart(lines: { product: PublicProduct; quantity: number; options: CustomizationOption[]; message: string; dedications?: Dedication[]; cardQuantity?: number }[]) {
  cartStore.update(items => addCartBatch(items, lines.map(line => ({ quantity: line.quantity, product: {
    id: line.product.id, name: line.product.name,
    price: Number(line.product.price) + line.options.reduce((sum, option) => sum + Number(option.extra_price), 0),
    image: pickImage(line.product)?.public_url ?? null, options: line.options, message: line.message, dedications: line.dedications, dedication_card_quantity: line.cardQuantity,
  } }))));
}
export function addToCart(product: PublicProduct, quantity = 1, options: CustomizationOption[] = [], message = "", dedications?: Dedication[], cardQuantity?: number) {
  cartStore.update((items) =>
    addItem(
      items,
      {
        id: product.id,
        name: product.name,
        price: Number(product.price) + options.reduce((sum, o) => sum + Number(o.extra_price), 0), options, message, dedications, dedication_card_quantity: cardQuantity,
        image: pickImage(product)?.public_url ?? null,
      },
      quantity,
    ),
  );
}

function changeQuantity(id: string, delta: number) {
  let next: CartItem[] = [];
  cartStore.update((items) => { next = changeItemQuantity(items, id, delta); return next; });
  return next;
}

function removeFromCart(id: string) {
  let next: CartItem[] = [];
  cartStore.update((items) => { next = removeItem(items, id); return next; });
  return next;
}

/**
 * Vuelve a consultar cada producto del carrito: el precio y la
 * disponibilidad pudieron cambiar desde que se agregó. (El servidor
 * recalcula siempre el precio real al crear el pedido; esto evita
 * mostrar datos viejos al cliente.)
 */
export async function refreshCartItems() {
  const current = cartStore.get();

  if (current.length === 0) return true;

  const fingerprint = JSON.stringify(current.map(item => [item.id, item.quantity]));
  let availability: { is_available: boolean }[];
  try {
    if (process.env.NEXT_PUBLIC_NOVA_VISUAL_PREVIEW === "true") availability = current.map(() => ({ is_available: true }));
    else {
      const response = await fetch("/api/products/availability", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: current.map(item => ({ product_id: item.id.split(":")[0], quantity: item.quantity,
          customization_option_ids: (item.options ?? []).map(option => option.id) })) }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.availability) || data.availability.length !== current.length) return false;
      availability = data.availability;
    }
  } catch { return false; }

  const results = await Promise.all(
    current.map(async (item) => {
      try {
        const response = await fetch(`/api/products/${item.id.split(":")[0]}`, {
          cache: "no-store",
        });

        if (response.status === 404) {
          return { id: item.id, product: null, gone: true };
        }

        if (!response.ok) return null;

        const data = (await response.json()) as {
          success?: boolean;
          product?: ProductDetail;
        };

        if (!data.success || !data.product) return null;

        return { id: item.id, product: data.product, gone: false };
      } catch {
        return null; // sin red: se deja el carrito como está
      }
    }),
  );

  cartStore.update((items) =>
    JSON.stringify(items.map(item => [item.id, item.quantity])) !== fingerprint ? items : items.map((item, index) => {
      const result = results.find((entry) => entry?.id === item.id);

      if (!result) return { ...item, available: item.available && availability[index].is_available };
      if (result.gone || !result.product) return { ...item, available: false };

      const product = result.product;

      return {
        ...item,
        name: product.name,
        price: Number(product.price) + (item.options ?? []).reduce((sum, o) => sum + Number(product.customization_options?.find(entry => entry.id === o.id)?.extra_price ?? o.extra_price), 0),
        image: pickImage(product)?.public_url ?? item.image,
        dedication_card_quantity: (product.dedication_card_quantity ?? 0) + (item.options ?? []).reduce((sum, option) => sum + (product.customization_options?.find(entry => entry.id === option.id)?.dedication_card_quantity ?? 0), 0),
        available: availability[index].is_available && isPurchasable(product) && (item.options ?? []).every(o => product.customization_options?.some(entry => entry.id === o.id)),
      };
    }),
  );
  return !hasUnavailable(cartStore.get());
}

/** Recheck on quantity changes, return to the tab and while a cart is visible. */
export function useCartAvailability(enabled: boolean) {
  const cart = useCart();
  const fingerprint = JSON.stringify(cart.items.map(item => [item.id, item.quantity]));
  useEffect(() => {
    if (!enabled) return;
    let running = false;
    const refresh = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try { await refreshCartItems(); } finally { running = false; }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [enabled, fingerprint]);
}

/* ============================================================
   PANEL DEL CARRITO
   ============================================================ */

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onBrowse: () => void;
  acceptingOrders: boolean;
  closedNotice: string | null;
  whatsappNumber: string | null;
  promotions?: PublicPromotion[];
  onReturnToOffer?: () => void;
};

export function CartDrawer({
  open,
  onClose,
  onBrowse,
  acceptingOrders,
  closedNotice,
  whatsappNumber,
  promotions = [],
  onReturnToOffer,
}: CartDrawerProps) {
  const cart = useCart();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!open) return; const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, [open]);
  const promotionId = usePromotionSelection() ?? "";
  const promotion = promotions.find(entry => entry.id === promotionId);
  const discount = promotion ? cartPromotion(promotion, cart.items, now) : null;
  const [editingDedication, setEditingDedication] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  function notifyChange(next: CartItem[], message: string) {
    const lostDiscount = discount && promotion && !cartPromotion(promotion, next, now);
    setFeedback(`${message} ${lostDiscount ? "El descuento se retiró porque la compra ya no cumple sus condiciones." : "Actualizamos el total y revisamos la promoción."}`);
  }


  function close() {
    setFeedback(""); setRemoving(null);
    onClose();
  }

  const panelRef = useDialog<HTMLElement>(open, close);

  // Cada vez que se abre el carrito se actualizan precios y disponibilidad.
  useCartAvailability(open);

  const invalidCards = cart.items.some(item => item.dedications && !dedicationsSchema.safeParse(item.dedications).success);
  const canContinue =
    cart.items.length > 0 && !cart.hasUnavailable && acceptingOrders && !invalidCards;

  const whatsappHref = whatsappLink(
    whatsappNumber,
    discount ? `${buildOrderMessage(cart.items).replace("\nTotal:", "\nSubtotal:")}\nOferta seleccionada: ${discount.promotion.name}\nDescuento estimado: ${formatMoney(discount.discount)}\nTotal estimado: ${formatMoney(discount.total)}\nLa tienda verificará las condiciones de la promoción.` : buildOrderMessage(cart.items),
  );

  return (
    <div
      hidden={!open}
      inert={!open}
      aria-hidden={!open}
      className="nova-cart-overlay fixed inset-0 z-[110] overflow-hidden bg-[#28202d]/40 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="nova-cart-panel absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-[#faf8fd] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#e7dfe9] px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#796481]">
              Tu compra
            </p>

            <h2
              id="cart-title"
              className={`${script.className} mt-1 text-[46px] leading-none text-[#4c285f]`}
            >
              Carrito
            </h2>
          </div>

          <button
            type="button"
            onClick={close}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e1d6e3] text-[#55485b] transition hover:bg-[#f5eff7]"
            aria-label="Cerrar carrito"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          {feedback && <div className="mb-4"><ShoppingNotice tone="success" onDismiss={() => setFeedback("")}>{feedback}</ShoppingNotice></div>}
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#f3ebf6] text-[#65358e]">
                <ShoppingBag size={26} strokeWidth={1.5} />
              </div>

              <h3
                className={`${script.className} mt-5 text-4xl text-[#4c285f]`}
              >
                Tu carrito está vacío
              </h3>

              <p className="mt-2 max-w-[260px] text-xs leading-5 text-[#746876]">
                Agrega algún detalle del catálogo para comenzar tu compra.
              </p>

              <button
                type="button"
                onClick={() => {
                  close();
                  onBrowse();
                }}
                className="mt-6 rounded-xl bg-[#65358e] px-5 py-3 text-xs font-black text-white transition hover:bg-[#572d7a]"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="nova-enter border-b border-[#eee7f0] py-5 first:pt-0"
              >
                <div className="flex gap-4">
                  <div className="relative flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eee5f0]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="76px"
                        className={`object-cover ${item.available ? "" : "opacity-50"}`}
                      />
                    ) : (
                      <span
                        className={`${script.className} text-3xl text-[#76547f]`}
                      >
                        Anabelle
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-black text-[#30283c]">
                      {item.name}
                    </p>

                    <p className="mt-1 text-sm font-black text-[#65358e]">
                      {formatMoney(item.price)}
                    </p>

                    {item.options?.map(option => <p key={option.id} className="mt-1 break-words text-xs text-[#6c6278]">{option.name}</p>)}
                    <DedicationPreview entries={item.dedications} compact/>{item.message && <p className="mt-1 break-words text-xs text-[#6c6278]">Tarjeta: {item.message}</p>}
                    {(item.dedication_card_quantity ?? 0) > 0 ? <div className="mt-3"><button type="button" className="min-h-11 text-sm font-bold text-[#65358e] underline" onClick={() => setEditingDedication(editingDedication === item.id ? null : item.id)}>{editingDedication === item.id ? "Terminar edición" : "Editar dedicatorias"}</button>{editingDedication === item.id && <DedicationEditor count={item.quantity * (item.dedication_card_quantity ?? 0)} value={item.dedications ?? (item.message ? [{ message: item.message, signature: "" }] : [])} onChange={dedications => cartStore.update(items => items.map(line => line.id === item.id ? { ...line, message: undefined, dedications } : line))}/>}</div> : item.dedications?.length || item.message ? <div className="mt-3"><ShoppingNotice>Este detalle ya no incluye tarjeta. Conservamos tu texto para que puedas revisarlo.</ShoppingNotice><button type="button" className="min-h-11 text-sm underline" onClick={() => cartStore.update(items => items.map(line => line.id === item.id ? { ...line, message: undefined, dedications: undefined } : line))}>Continuar sin dedicatorias</button></div> : null}
                    {removing === item.id && <div className="my-3 rounded-xl border border-[#d8c6e3] bg-[#f4edf8] p-3" role="group" aria-label="Confirmar eliminación"><p className="text-sm font-bold text-[#59436c]">¿Eliminar este producto del carrito?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded-xl bg-[#65358e] px-3 py-2 text-sm font-bold text-white" onClick={() => { notifyChange(removeFromCart(item.id), "Producto eliminado del carrito."); setRemoving(null); }}>Sí, eliminar producto</button><button type="button" className="min-h-11 rounded-xl border border-[#cebbdb] bg-white px-3 py-2 text-sm font-bold text-[#604581]" onClick={() => setRemoving(null)}>Conservar producto</button></div></div>}
                    {!item.available ? (
                      <div className="mt-3"><ShoppingNotice tone="error">No podemos preparar este detalle en la cantidad elegida. Prueba una cantidad menor o elige otro producto para continuar.</ShoppingNotice></div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-[#ded2e2]">
                        <button
                          type="button"
                          onClick={() => item.quantity === 1 ? setRemoving(item.id) : notifyChange(changeQuantity(item.id, -1), "Cantidad actualizada.")}
                          className="flex size-11 items-center justify-center text-[#5c4e61] transition hover:bg-[#f5eff7]"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          −
                        </button>

                        <span key={item.quantity} className="nova-value flex size-9 items-center justify-center border-x border-[#ded2e2] text-xs font-black">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => notifyChange(changeQuantity(item.id, 1), "Cantidad actualizada.")}
                          disabled={!item.available || item.quantity >= MAX_QUANTITY}
                          className="flex size-11 items-center justify-center text-[#5c4e61] transition hover:bg-[#f5eff7] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRemoving(item.id)}
                        className="px-1 py-2 text-[11px] font-bold text-[#756779] transition hover:text-[#65358e]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <PromotionCartSummary promotions={promotions} selectedId={promotionId} items={cart.items} onSelect={selectPromotion} onBrowse={onReturnToOffer ? () => { close(); onReturnToOffer(); } : undefined}/>
        </div>

        <div className="shrink-0 border-t border-[#e7dfe9] bg-white px-6 py-6 pb-[max(24px,env(safe-area-inset-bottom))]">

          <div className="flex items-center justify-between text-sm text-[#706474]">
            <span>Subtotal</span>
            <span key={cart.total} className="nova-value tabular-nums">{formatMoney(cart.total)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-lg font-black text-[#403344]">
            <span>Total estimado</span>
            <span key={discount?.total ?? cart.total} className="nova-value tabular-nums">{formatMoney(discount?.total ?? cart.total)}</span>
          </div>

          {!acceptingOrders && closedNotice ? (
            <p
              role="status"
              className="mt-4 rounded-xl bg-[#f6f0f8] px-4 py-3 text-xs leading-5 text-[#55455c]"
            >
              {closedNotice}
            </p>
          ) : null}

          {canContinue ? <Link href="/checkout" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] text-sm font-black text-white">Continuar compra <ArrowRight size={16} /></Link> : cart.items.length > 0 ? <div className="mt-4"><ShoppingNotice>{invalidCards ? "Escribe los mensajes de tus tarjetas o elige dejarlas en blanco para continuar." : "Revisa la disponibilidad de tus productos y el horario de la tienda para continuar."}</ShoppingNotice></div> : null}
          {whatsappHref && cart.items.length > 0 ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm text-[#65358e]"><MessageCircle size={16} /> Comprar por WhatsApp</a> : null}
        </div>
      </aside>
    </div>
  );
}
