"use client";

import { X } from "lucide-react";
import { CartItem, type CartItemData } from "./cart-item";
import { CartSummary } from "./cart-summary";

type CartDrawerProps = {
  open: boolean;
  items: CartItemData[];
  onClose: () => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
};

export function CartDrawer({
  open,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
}: CartDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={onClose}
        className="absolute inset-0 bg-[#403344]/45 backdrop-blur-[2px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-[#faf7fb] shadow-[-15px_0_40px_rgba(65,39,75,.16)]">
        <div className="flex items-center justify-between border-b border-[#e8e0ea] bg-white px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9270a4]">
              Tu compra
            </p>

            <h2 className="mt-1 text-xl font-black text-[#403344]">
              Carrito
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="flex size-10 items-center justify-center rounded-xl border border-[#ded2e2] text-[#6e6372] transition hover:border-[#65358e] hover:text-[#65358e]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="text-7xl text-[#b9a3c1]">✿</div>

                <h3 className="mt-5 text-lg font-black text-[#403344]">
                  Tu carrito está vacío
                </h3>

                <p className="mt-2 text-sm text-[#7b707f]">
                  Explora nuestros arreglos y agrega tu favorito.
                </p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                onIncrease={() => onIncrease(item.product_id)}
                onDecrease={() => onDecrease(item.product_id)}
                onRemove={() => onRemove(item.product_id)}
              />
            ))
          )}
        </div>

        <div className="border-t border-[#e8e0ea] bg-[#faf7fb] p-6">
          <CartSummary items={items} />
        </div>
      </aside>
    </div>
  );
}