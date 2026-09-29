"use client";

import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";

import { Customization } from "./customization";

type CustomizationOption = {
  id: string;
  option_type: string;
  name: string;
  value: string | null;
  extra_price: number;
};

type ProductInfoProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    occasion: string | null;
    is_available: boolean;
    is_sold_out: boolean;
    customization_options: CustomizationOption[];
  };
  onAddToCart: (optionIds: string[]) => void;
};

export function ProductInfo({
  product,
  onAddToCart,
}: ProductInfoProps) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    [],
  );

  const extraPrice = useMemo(() => {
    return product.customization_options
      .filter((option) => selectedOptionIds.includes(option.id))
      .reduce((total, option) => total + Number(option.extra_price), 0);
  }, [product.customization_options, selectedOptionIds]);

  const totalPrice = product.price + extraPrice;

  const unavailable =
    !product.is_available || product.is_sold_out;

  return (
    <div className="flex flex-col">
      {product.occasion && (
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9270a4]">
          {product.occasion}
        </p>
      )}

      <h1 className="mt-3 text-3xl font-black tracking-tight text-[#403344] sm:text-4xl">
        {product.name}
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl font-black text-[#65358e]">
          Bs {totalPrice.toFixed(2)}
        </span>

        {product.is_sold_out && (
          <span className="rounded-full bg-[#f4e8eb] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#a55b6d]">
            Agotado
          </span>
        )}

        {!product.is_available && !product.is_sold_out && (
          <span className="rounded-full bg-[#eee8f1] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#756779]">
            No disponible
          </span>
        )}
      </div>

      {product.description && (
        <p className="mt-6 text-sm leading-7 text-[#756b79]">
          {product.description}
        </p>
      )}

      {product.customization_options.length > 0 && (
        <div className="mt-8">
          <Customization
            options={product.customization_options}
            selectedOptionIds={selectedOptionIds}
            onChange={setSelectedOptionIds}
          />
        </div>
      )}

      <button
        type="button"
        disabled={unavailable}
        onClick={() => onAddToCart(selectedOptionIds)}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] px-5 text-xs font-black text-white transition hover:bg-[#572d7a] disabled:cursor-not-allowed disabled:bg-[#c9bdce]"
      >
        <ShoppingBag size={16} />

        {product.is_sold_out
          ? "Producto agotado"
          : !product.is_available
            ? "Producto no disponible"
            : "Agregar al carrito"}
      </button>
    </div>
  );
}