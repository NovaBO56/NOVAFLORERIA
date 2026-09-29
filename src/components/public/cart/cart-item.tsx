"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

export type CartItemData = {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  customization_option_ids: string[];
  customization_options: {
    id: string;
    name: string;
    value: string | null;
    extra_price: number;
  }[];
  message?: string | null;
  note?: string | null;
};

type CartItemProps = {
  item: CartItemData;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  const optionsTotal = item.customization_options.reduce(
    (total, option) => total + Number(option.extra_price || 0),
    0,
  );

  const unitPrice = Number(item.price) + optionsTotal;
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="flex gap-4 border-b border-[#eee7f0] py-5 last:border-b-0">
      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-[#eee5f0]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-[#b9a3c1]">
            ✿
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-sm font-black text-[#403344]">
              {item.name}
            </h3>

            {item.customization_options.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {item.customization_options.map((option) => (
                  <p
                    key={option.id}
                    className="text-[11px] text-[#817483]"
                  >
                    {option.name}
                    {option.extra_price > 0
                      ? ` (+Bs ${Number(option.extra_price).toFixed(2)})`
                      : ""}
                  </p>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar ${item.name}`}
            className="shrink-0 text-[#a58da9] transition hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-[#ded2e2]">
            <button
              type="button"
              onClick={onDecrease}
              className="flex size-8 items-center justify-center text-[#6e6372] hover:text-[#65358e]"
            >
              <Minus size={13} />
            </button>

            <span className="w-8 text-center text-xs font-black text-[#403344]">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={onIncrease}
              className="flex size-8 items-center justify-center text-[#6e6372] hover:text-[#65358e]"
            >
              <Plus size={13} />
            </button>
          </div>

          <p className="text-sm font-black text-[#65358e]">
            Bs {lineTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}