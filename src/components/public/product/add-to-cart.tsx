"use client";

import { ShoppingBag } from "lucide-react";

type AddToCartProps = {
  disabled?: boolean;
  onClick: () => void;
};

export function AddToCart({
  disabled = false,
  onClick,
}: AddToCartProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition hover:-translate-y-0.5 hover:bg-[#572d7a] disabled:cursor-not-allowed disabled:bg-[#b7aaba] disabled:shadow-none"
    >
      <ShoppingBag size={18} />
      {disabled ? "No disponible" : "Agregar al carrito"}
    </button>
  );
}