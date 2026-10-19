"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "../safe-image";
import { formatMoney, isPurchasable, pickImage, promotionBenefit, promotionValidity } from "@/lib/public/format";
import { canBuildCombo, promotionIsCurrent, promotionPricePreview } from "@/lib/public/promotion-shopping";
import type { PublicProduct, PublicPromotion } from "@/lib/public/types";
import { script } from "./shared";

export function PromotionSection({ promotions, onChooseProduct, onBuildCombo, initialPromotionId }: {
  promotions: PublicPromotion[];
  onChooseProduct?: (promotion: PublicPromotion, product: PublicProduct) => void;
  onBuildCombo?: (promotion: PublicPromotion) => void;
  initialPromotionId?: string | null;
}) {
  const [active, setActive] = useState(() => Math.max(0, promotions.filter(promotion => promotionIsCurrent(promotion)).findIndex(promotion => promotion.id === initialPromotionId)));
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const touch = useRef<{ x: number; y: number } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const offers = promotions.filter(promotion => promotionIsCurrent(promotion, now));
  if (!offers.length) return null;
  const index = active % offers.length, promotion = offers[index];
  const lines = promotion.products ?? [];
  const eligible = lines.flatMap(line => line.product ? [line.product] : []);
  const image = eligible.map(pickImage).find(Boolean);
  const preview = promotionPricePreview(promotion);
  const combo = canBuildCombo(promotion);
  const single = promotion.promotion_type === "producto" && lines.length === 1 && eligible.length === 1;
  function move(delta: number) { setActive((index + delta + offers.length) % offers.length); setExpanded(false); }
  function choose() {
    if (combo && onBuildCombo) onBuildCombo(promotion);
    else if (single && onChooseProduct && isPurchasable(eligible[0])) onChooseProduct(promotion, eligible[0]);
    else setExpanded(true);
  }
  return <section id="promociones" aria-labelledby="promotion-title" className="scroll-mt-44 px-5 pb-16 sm:px-8 sm:pb-20">
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#796481]">Un detalle especial</p><h2 id="promotion-title" className={`${script.className} mt-2 text-5xl text-[#4c285f]`}>Ofertas para ti</h2></div>
        {offers.length > 1 && <div className="flex gap-2"><button type="button" aria-label="Promoción anterior" className="promotion-arrow" onClick={() => move(-1)}><ChevronLeft aria-hidden size={20}/></button><button type="button" aria-label="Promoción siguiente" className="promotion-arrow" onClick={() => move(1)}><ChevronRight aria-hidden size={20}/></button></div>}
      </div>
      <div role="region" aria-roledescription="carrusel" aria-label="Promociones disponibles" tabIndex={0}
        onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === "ArrowRight") { event.preventDefault(); move(1); } if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } }}
        onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }}
        onTouchEnd={event => { const start = touch.current; touch.current = null; const end = event.changedTouches[0]; if (start && end && Math.abs(end.clientX - start.x) > 55 && Math.abs(end.clientX - start.x) > Math.abs(end.clientY - start.y) * 1.5) move(end.clientX < start.x ? 1 : -1); }}
        className="overflow-hidden rounded-[28px] border border-[#e2d5e5] bg-white shadow-[0_18px_50px_-36px_#65358e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]">
        <article key={promotion.id} aria-roledescription="diapositiva" aria-label={`${index + 1} de ${offers.length}`} className="nova-enter grid min-w-0 [overflow-wrap:anywhere] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
          <div className="min-w-0 bg-[#f4edf7] p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold text-[#65358e]">{promotion.promotion_type === "combo" ? "Productos que se complementan" : "En productos seleccionados"}</p>
            <h3 ref={heading} className={`${script.className} mt-4 break-words text-[42px] leading-tight text-[#4c285f] sm:text-[54px]`}>{promotion.name}</h3>
            {promotion.description && <p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-[#6a5e6e]">{promotion.description}</p>}
            <p className="mt-5 text-xl font-bold text-[#65358e]">{promotionBenefit(promotion)}</p>
            {preview && <p className="mt-3 text-sm text-[#6a5e6e]"><span>Precio normal: <s>{formatMoney(preview.before)}</s></span><strong className="ml-3 inline-block text-lg text-[#4c285f]">{formatMoney(preview.after)}</strong><span className="mt-1 block text-xs">{promotion.promotion_type === "combo" ? "Por un combo completo. " : "Por una unidad. "}Sin extras de personalización.</span></p>}
            <ul className="mt-4 space-y-2 text-sm text-[#6a5e6e]">
              {lines.map(line => <li key={line.product_id}>{promotion.promotion_type === "combo" ? `${line.quantity} × ` : ""}{line.product?.name ?? "Producto temporalmente no disponible"}</li>)}
              {Number(promotion.minimum_purchase) > 0 && <li>Compra mínima del pedido: {formatMoney(promotion.minimum_purchase!)}.</li>}
              {promotionValidity(promotion) && <li>{promotionValidity(promotion)}</li>}
              <li>Una promoción por pedido. El servidor verifica las condiciones.</li>
              {promotion.promotion_type === "combo" && <li>Se requieren todos los productos y cantidades. Los extras se cobran aparte.</li>}
            </ul>
            {eligible.some(isPurchasable) ? <button type="button" onClick={choose} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] px-5 py-3 text-sm font-bold text-white hover:bg-[#572d7a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e] sm:w-auto">{combo && onBuildCombo ? "Comprar combo" : single ? "Comprar esta oferta" : "Elegir productos participantes"}<ArrowRight aria-hidden size={18}/></button> : <p className="mt-6 rounded-xl bg-white p-4 text-sm text-[#6a5e6e]">Esta oferta no tiene productos disponibles para comprar en este momento.</p>}
          </div>
          <div className="relative order-first flex min-h-[200px] items-center justify-center bg-[#eee5f1] lg:order-last lg:min-h-[420px]">
            {image ? <SafeImage src={image.public_url} alt={image.alt_text || eligible[0]?.name || "Producto participante"} fill sizes="(min-width:1024px) 520px, 100vw" className="object-contain p-5 sm:p-8"/> : <div aria-hidden className="p-8 text-center"><span className="text-8xl text-[#9270a4]">✿</span><p className={`${script.className} mt-3 text-4xl text-[#684572]`}>Hecho con intención</p></div>}
          </div>
        </article>
        {expanded && <div className="border-t border-[#e2d5e5] p-6"><h4 className="font-bold text-[#4c285f]">Elige y personaliza los productos participantes</h4><p className="mt-2 text-sm text-[#6a5e6e]">No agregamos productos automáticamente. El carrito mostrará cuándo cumple las condiciones.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{eligible.map(product => <button key={product.id} type="button" disabled={!isPurchasable(product)} onClick={() => onChooseProduct?.(promotion, product)} className="min-w-0 rounded-xl border border-[#d8c8de] p-4 text-left disabled:opacity-50"><strong className="block break-words text-sm text-[#4c285f]">{product.name}</strong><span className="mt-2 block text-sm">{formatMoney(product.price)} · {isPurchasable(product) ? "Ver y personalizar" : "No disponible"}</span></button>)}</div></div>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1" aria-label="Posición del carrusel">{offers.map((offer, position) => <button type="button" key={offer.id} aria-label={`Ver promoción ${position + 1}: ${offer.name}`} aria-current={position === index ? "true" : undefined} onClick={() => { setActive(position); setExpanded(false); }} className="flex min-h-11 min-w-11 items-center justify-center"><span className={`h-2 rounded-full transition-[opacity,transform] motion-reduce:transition-none ${position === index ? "w-6 bg-[#65358e]" : "w-2 bg-[#d8c8de]"}`}/></button>)}</div>
      <p role="status" aria-live="polite" className="sr-only">Promoción {index + 1} de {offers.length}: {promotion.name}</p>
    </div>
  </section>;
}
