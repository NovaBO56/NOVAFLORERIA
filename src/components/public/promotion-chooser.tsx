"use client";

import { cartPromotion } from "@/lib/public/cart-promotions";
import { promotionProgress } from "@/lib/public/promotion-shopping";
import { formatMoney, promotionBenefit, promotionValidity } from "@/lib/public/format";
import type { CartItem } from "@/lib/public/cart-logic";
import type { PublicPromotion } from "@/lib/public/types";
import { CheckCircle2, CircleAlert, Tag } from "lucide-react";

export function promotionChoices(promotions: PublicPromotion[], items: CartItem[], now: number) {
  return promotions.flatMap(promotion => {
    const result = cartPromotion(promotion, items, now);
    return result ? [result] : [];
  }).sort((a, b) => b.discount - a.discount || a.promotion.id.localeCompare(b.promotion.id));
}

/** A suggestion is optional. An ineligible selection never appears as an active benefit. */
export function PromotionChooser({ promotions, items, selectedId, now, onSelect }: {
  promotions: PublicPromotion[]; items: CartItem[]; selectedId: string; now: number; onSelect: (id: string) => void;
}) {
  const choices = promotionChoices(promotions, items, now);
  const selected = promotions.find(promotion => promotion.id === selectedId);
  const applied = choices.find(choice => choice.promotion.id === selectedId);
  const suggestion = !selectedId ? choices[0] : null;
  const invalid = Boolean(selectedId && !applied);
  if (!selectedId && !choices.length) return null;

  const displayed = selected ?? suggestion?.promotion;
  const Icon = invalid ? CircleAlert : applied ? CheckCircle2 : Tag;
  const title = invalid ? "Promoción no aplicada" : applied ? "Promoción seleccionada" : "Promoción disponible";
  const hasOtherChoices = choices.some(choice => choice.promotion.id !== (selectedId || suggestion?.promotion.id));
  const condition = displayed?.promotion_type === "combo"
    ? "Incluye todos los productos y cantidades del combo. Los extras se cobran aparte."
    : "El beneficio se calcula solo sobre los productos participantes.";

  return <section aria-label="Promoción de tu compra" data-promotion-state={invalid ? "invalid" : applied ? "selected" : "suggested"}
    className={`min-w-0 rounded-2xl border p-4 text-sm ${invalid ? "border-amber-200 bg-amber-50 text-amber-950" : "border-[#e6d7d8] bg-[#fbf2ef] text-[#645460]"}`}>
    <div key={`${selectedId}-${applied?.discount ?? 0}`} role="status" aria-live="polite" className="nova-fade min-w-0 [overflow-wrap:anywhere]">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
        <Icon size={18} className={`shrink-0 ${invalid ? "text-amber-700" : applied ? "text-[#53705b]" : "text-[#873c58]"}`} aria-hidden/>{title}
      </p>
      <h3 className="mt-2 text-base font-bold">{displayed?.name ?? "Promoción ya no disponible"}</h3>
      {applied ? <div className="mt-3 rounded-xl bg-white/75 p-3">
        <p className="text-xs font-semibold">Beneficio esperado · {promotionBenefit(applied.promotion)}</p>
        <p className="mt-1 font-bold">Descuento estimado: −{formatMoney(applied.discount)}</p>
        <p className="mt-1 text-xs">Tu descuento se confirmará antes de finalizar el pedido.</p>
      </div> : suggestion ? <div className="mt-3">
        <p className="font-bold">Puedes ahorrar {formatMoney(suggestion.discount)}</p>
        <p className="mt-1">Es opcional. Tu total sigue sin descuento hasta que la elijas.</p>
      </div> : <div className="mt-3">
        <p className="font-semibold">Esta promoción ya no aplica a los productos seleccionados.</p>
        {selected && <p className="mt-1">{promotionProgress(selected, items, now)}</p>}
        <p className="mt-2">Puedes elegir otra promoción o continuar sin descuento.</p>
      </div>}
      {displayed && <div className="mt-3 space-y-1 text-xs leading-5">
        <p><strong>Condición:</strong> {condition}</p>
        {Number(displayed.minimum_purchase) > 0 && <p>Compra mínima: {formatMoney(Number(displayed.minimum_purchase))}.</p>}
        {promotionValidity(displayed) && <p>{promotionValidity(displayed)}.</p>}
      </div>}
    </div>
    {suggestion && <button type="button" onClick={() => onSelect(suggestion.promotion.id)} className="customer-secondary mt-3 w-full">Elegir esta promoción</button>}
    {selectedId && <button type="button" onClick={() => onSelect("")} className="mt-3 min-h-11 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873c58]">
      {invalid ? "Continuar sin descuento" : "Quitar promoción"}
    </button>}
    {hasOtherChoices && <details className="mt-2 border-t border-current/15 pt-1">
      <summary className="min-h-11 cursor-pointer py-3 font-bold focus-visible:outline-2 focus-visible:outline-[#873c58]">{selectedId ? "Cambiar promoción" : "Ver otras promociones"}</summary>
      <label className="block pb-2">Elige una sola promoción
        <select className="mt-2 min-h-12 w-full min-w-0 rounded-lg border border-[#d9bfc6] bg-white px-2 text-sm text-[#645460]" value={selectedId} onChange={event => onSelect(event.target.value)}>
          <option value="">Sin promoción</option>
          {selectedId && !applied && <option value={selectedId} disabled>{selected?.name ?? "Promoción no disponible"} · no aplicada</option>}
          {choices.map(choice => <option key={choice.promotion.id} value={choice.promotion.id}>{choice.promotion.name} · ahorro {formatMoney(choice.discount)}</option>)}
        </select>
      </label>
    </details>}
    <p className="mt-2 text-xs leading-5">Una promoción por pedido. Esta promoción se aplicará si tu pedido cumple las condiciones.</p>
  </section>;
}
