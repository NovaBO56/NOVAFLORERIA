"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import {
  formatMoney,
  initials,
  isPurchasable,
} from "@/lib/public/format";
import { MAX_QUANTITY } from "@/lib/public/cart-logic";
import type { ProductDetail, PublicProduct } from "@/lib/public/types";
import { script } from "./shared";

type DetailState = { id: string; data: ProductDetail | null } | null;

type ProductDetailSectionProps = {
  product: PublicProduct;
  categoryName: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAdd: (quantity: number) => void;
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
}: ProductDetailSectionProps) {
  const [detail, setDetail] = useState<DetailState>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // La lista trae lo básico; descripción e ingredientes vienen del detalle.
  useEffect(() => {
    let cancelled = false;

    (async () => {
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
    })();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const loadingDetail = detail?.id !== product.id;
  const full = detail?.id === product.id ? detail.data : null;

  const images = (full?.images?.length ? full.images : product.images) ?? [];
  const current = images[activeImage] ?? images[0] ?? null;

  const purchasable = isPurchasable(full ?? product);

  const includes = (full?.components ?? [])
    .map((entry) =>
      entry.component_product
        ? `${Number(entry.quantity)} × ${entry.component_product.name}`
        : null,
    )
    .filter((text): text is string => Boolean(text));

  return (
    <section
      id="detalle"
      className="scroll-mt-20 border-y border-[#e8e0ea] bg-white px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
            Vista de producto
          </p>

          <h2
            className={`${script.className} mt-2 text-[50px] leading-none text-[#4c285f]`}
          >
            Detalle
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div
            className={`grid gap-4 ${
              images.length > 1 ? "grid-cols-[84px_1fr]" : "grid-cols-1"
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
                  src={current.public_url}
                  alt={current.alt_text ?? product.name}
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover"
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

          <div className="flex flex-col justify-center">
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

            <p className="mt-5 text-2xl font-black text-[#65358e]">
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
                  disabled={quantity <= 1}
                  className="flex size-11 items-center justify-center text-[#5c4e61] disabled:opacity-40"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>

                <span
                  className="flex size-11 items-center justify-center border-x border-[#ded2e2] text-sm font-black"
                  aria-live="polite"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))
                  }
                  disabled={quantity >= MAX_QUANTITY}
                  className="flex size-11 items-center justify-center text-[#5c4e61] disabled:opacity-40"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onAdd(quantity)}
                disabled={!purchasable}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#65358e] sm:flex-1 text-sm font-black text-white transition hover:bg-[#572d7a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={17} />
                {purchasable
                  ? "Agregar al carrito"
                  : product.is_sold_out
                    ? "Agotado"
                    : "No disponible"}
              </button>

              <button
                type="button"
                onClick={onToggleFavorite}
                aria-pressed={isFavorite}
                className="flex h-12 items-center justify-center rounded-xl border border-[#d8cadd] px-5 text-[#65358e] transition hover:bg-[#f5eff7]"
                aria-label={
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }
              >
                <Heart size={18} className={isFavorite ? "fill-current" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}