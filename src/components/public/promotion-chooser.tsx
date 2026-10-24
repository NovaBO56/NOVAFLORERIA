"use client";

import { cartPromotion } from "@/lib/public/cart-promotions";
import { promotionProgress } from "@/lib/public/promotion-shopping";
import { formatMoney } from "@/lib/public/format";
import type { CartItem } from "@/lib/public/cart-logic";
import type { PublicPromotion } from "@/lib/public/types";
import { Tag } from "lucide-react";

export function promotionChoices(promotions: PublicPromotion[], items: CartItem[], now: number) {
  return promotions.flatMap(promotion => {
    const result = cartPromotion(promotion, items, now);
    return result ? [result] : [];
  }).sort((a, b) => b.discount - a.discount || a.promotion.id.localeCompare(b.promotion.id));
}

/** Choosing is always explicit; a suggestion never changes totals or saved intent. */
export function PromotionChooser({ promotions, items, selectedId, now, onSelect }: {
  promotions: PublicPromotion[]; items: CartItem[]; selectedId: string; now: number; onSelect: (id: string) => void;
}) {
  const choices = promotionChoices(promotions, items, now);
  const selected = promotions.find(promotion => promotion.id === selectedId);
  const applied = choices.find(choice => choice.promotion.id === selectedId);
  const suggestion = !selectedId ? choices[0] : null;
  if (!selectedId && !choices.length) return null;
  const displayed = selected ?? suggestion?.promotion;
  return <section aria-label="Promoción de tu compra" className="min-w-0 rounded-xl border border-[#e6d7d8] bg-[#f3e3e5] p-4 text-sm text-[#645460]">
    <div key={`${selectedId}-${applied?.discount ?? 0}`} role="status" aria-live="polite" className="nova-fade break-words">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><Tag size={16} className="shrink-0 text-[#946a13]" aria-hidden/>{selectedId ? "Tu promoción seleccionada" : "Sugerencia · mayor ahorro"}</p>
      <h3 className="mt-1 text-base font-bold">{displayed?.name ?? "Oferta seleccionada no disponible"}</h3>
      {applied ? <p className="mt-2 font-bold">Ahorras {formatMoney(applied.discount)} · descuento estimado aplicado</p> : suggestion ? <><p className="mt-2 font-bold">Puedes ahorrar {formatMoney(suggestion.discount)}</p><p className="mt-1">No se aplica hasta que la elijas. Tu total sigue sin descuento.</p></> : <p className="mt-2">{selected ? promotionProgress(selected, items, now) : "La oferta ya no está disponible. No se aplica ningún descuento."}</p>}
      {displayed && <p className="mt-2 text-xs">{displayed.promotion_type === "combo" ? "Requiere el combo completo; los extras se cobran aparte." : "Solo sobre los productos participantes."}{Number(displayed.minimum_purchase) > 0 ? ` Compra mínima: ${formatMoney(Number(displayed.minimum_purchase))}.` : ""}{displayed.ends_at ? ` Válida hasta ${new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeZone: "America/La_Paz" }).format(new Date(displayed.ends_at))}.` : ""}</p>}
    </div>
    {suggestion && <button type="button" onClick={() => onSelect(suggestion.promotion.id)} className="customer-secondary mt-3 w-full">Usar esta promoción</button>}
    {selectedId && <button type="button" onClick={() => onSelect("")} className="mt-2 min-h-11 font-bold underline">{applied ? "Continuar sin promoción" : "Quitar oferta seleccionada"}</button>}
    {choices.some(choice => choice.promotion.id !== (selectedId || suggestion?.promotion.id)) && <details className="mt-3 border-t border-[#e6d7d8] pt-2">
      <summary className="min-h-11 cursor-pointer py-3 font-bold focus-visible:outline-2 focus-visible:outline-[#873c58]">Ver otras promociones</summary>
      <label className="block pb-2">Elige una sola promoción<select className="mt-2 min-h-12 w-full min-w-0 rounded-lg border border-[#d9bfc6] bg-white px-2 text-sm" value={selectedId} onChange={event => onSelect(event.target.value)}>
        <option value="">Sin promoción</option>
        {selectedId && !applied && <option value={selectedId} disabled>{selected?.name ?? "Oferta no disponible"} · no aplicada</option>}
        {choices.map(choice => <option key={choice.promotion.id} value={choice.promotion.id}>{choice.promotion.name} · ahorro {formatMoney(choice.discount)}</option>)}
      </select></label>
    </details>}
    <p className="mt-2 text-xs">Una promoción por pedido. Comprobaremos tu oferta antes de mostrarte el importe final.</p>
  </section>;
}
