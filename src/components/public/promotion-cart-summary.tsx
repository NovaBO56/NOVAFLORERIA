"use client";
import { useEffect, useState } from "react";
import { PromotionChooser, promotionChoices } from "./promotion-chooser";
import type { CartItem } from "@/lib/public/cart-logic";
import type { PublicPromotion } from "@/lib/public/types";

export function PromotionCartSummary({ promotions, selectedId, items, onSelect, onBrowse }: { promotions: PublicPromotion[]; selectedId: string; items: CartItem[]; onSelect: (id: string) => void; onBrowse?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const selected = promotions.find(promotion => promotion.id === selectedId);
  if (!selectedId && !promotionChoices(promotions, items, now).length) return null;
  return <div className="my-4">
    <PromotionChooser promotions={promotions} items={items} selectedId={selectedId} now={now} onSelect={onSelect}/>
    {onBrowse && selected && <button type="button" className="mt-2 min-h-11 font-bold underline" onClick={onBrowse}>Volver a la oferta</button>}
  </div>;
}
