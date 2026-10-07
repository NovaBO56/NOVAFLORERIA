"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, MessageCircle, ShoppingBag, X } from "lucide-react";
import {
  addItem,
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
import type { ProductDetail, PublicProduct } from "@/lib/public/types";
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

export function addToCart(product: PublicProduct, quantity = 1) {
  cartStore.update((items) =>
    addItem(
      items,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: pickImage(product)?.public_url ?? null,
      },
      quantity,
    ),
  );
}

function changeQuantity(id: string, delta: number) {
  cartStore.update((items) => changeItemQuantity(items, id, delta));
}

function removeFromCart(id: string) {
  cartStore.update((items) => removeItem(items, id));
}

/**
 * Vuelve a consultar cada producto del carrito: el precio y la
 * disponibilidad pudieron cambiar desde que se agregó. (El servidor
 * recalcula siempre el precio real al crear el pedido; esto evita
 * mostrar datos viejos al cliente.)
 */
async function refreshCartItems() {
  const current = cartStore.get();

  if (current.length === 0) return;

  const results = await Promise.all(
    current.map(async (item) => {
      try {
        const response = await fetch(`/api/products/${item.id}`, {
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
    items.map((item) => {
      const result = results.find((entry) => entry?.id === item.id);

      if (!result) return item;
      if (result.gone || !result.product) return { ...item, available: false };

      const product = result.product;

      return {
        ...item,
        name: product.name,
        price: Number(product.price),
        image: pickImage(product)?.public_url ?? item.image,
        available: isPurchasable(product),
      };
    }),
  );
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
};

export function CartDrawer({
  open,
  onClose,
  onBrowse,
  acceptingOrders,
  closedNotice,
  whatsappNumber,
}: CartDrawerProps) {
  const cart = useCart();
  const [fallbackOpen, setFallbackOpen] = useState(false);

  function close() {
    setFallbackOpen(false);
    onClose();
  }

  const panelRef = useDialog<HTMLElement>(open, close);

  // Cada vez que se abre el carrito se actualizan precios y disponibilidad.
  useEffect(() => {
    if (open) void refreshCartItems();
  }, [open]);

  if (!open) return null;

  const canContinue =
    cart.items.length > 0 && !cart.hasUnavailable && acceptingOrders;

  const whatsappHref = whatsappLink(
    whatsappNumber,
    buildOrderMessage(cart.items),
  );

  return (
    <div
      className="fixed inset-0 z-[110] bg-[#28202d]/40 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#e7dfe9] px-6 py-5">
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
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
                className="border-b border-[#eee7f0] py-5 first:pt-0"
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
                        NOVA
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#403344]">
                      {item.name}
                    </p>

                    <p className="mt-1 text-sm font-black text-[#65358e]">
                      {formatMoney(item.price)}
                    </p>

                    {!item.available ? (
                      <p
                        role="alert"
                        className="mt-1 text-xs font-bold text-[#b42318]"
                      >
                        Ya no está disponible. Quítalo para continuar.
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-[#ded2e2]">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, -1)}
                          className="flex size-9 items-center justify-center text-[#5c4e61] transition hover:bg-[#f5eff7]"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          −
                        </button>

                        <span className="flex size-9 items-center justify-center border-x border-[#ded2e2] text-xs font-black">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          disabled={!item.available}
                          className="flex size-9 items-center justify-center text-[#5c4e61] transition hover:bg-[#f5eff7] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
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
        </div>

        <div className="border-t border-[#e7dfe9] px-6 py-6">
          <div className="flex items-center justify-between text-sm text-[#706474]">
            <span>Subtotal</span>
            <span>{formatMoney(cart.total)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-lg font-black text-[#403344]">
            <span>Total</span>
            <span>{formatMoney(cart.total)}</span>
          </div>

          {!acceptingOrders && closedNotice ? (
            <p
              role="status"
              className="mt-4 rounded-xl bg-[#f6f0f8] px-4 py-3 text-xs leading-5 text-[#55455c]"
            >
              {closedNotice}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setFallbackOpen(true)}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] text-sm font-black text-white transition hover:bg-[#572d7a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar compra
            <ArrowRight size={16} />
          </button>

          {/*
            TEMPORAL: la pantalla de pago en línea (datos → pedido → QR →
            seguimiento) todavía no existe. Mientras tanto el cliente puede
            enviar su pedido por WhatsApp. Cuando exista, "Continuar compra"
            debe navegar al checkout y este bloque se elimina.
          */}
          {fallbackOpen && canContinue ? (
            <div
              role="status"
              className="mt-4 rounded-xl border border-[#e2d5e5] bg-[#faf8fb] px-4 py-4"
            >
              <p className="text-xs leading-5 text-[#55455c]">
                El pago en línea estará disponible muy pronto. Por ahora puedes
                enviarnos tu pedido por WhatsApp y te ayudamos a completarlo.
              </p>

              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#65358e] text-sm font-black text-[#65358e] transition hover:bg-[#f5eff7]"
                >
                  <MessageCircle size={16} />
                  Enviar pedido por WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}