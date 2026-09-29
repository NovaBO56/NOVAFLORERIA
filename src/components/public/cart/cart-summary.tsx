import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CartItemData } from "./cart-item";

type CartSummaryProps = {
  items: CartItemData[];
  onCheckout?: () => void;
};

export function CartSummary({
  items,
  onCheckout,
}: CartSummaryProps) {
  const subtotal = items.reduce((total, item) => {
    const optionsTotal = item.customization_options.reduce(
      (sum, option) => sum + Number(option.extra_price || 0),
      0,
    );

    return total + (Number(item.price) + optionsTotal) * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e8e0ea] bg-white p-6">
        <p className="text-sm font-black text-[#403344]">
          Tu carrito está vacío
        </p>

        <p className="mt-2 text-xs leading-5 text-[#7b707f]">
          Agrega algunos arreglos para continuar.
        </p>

        <Link
          href="/catalogo"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#65358e] px-5 text-xs font-black text-white transition hover:bg-[#572d7a]"
        >
          Explorar catálogo
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8e0ea] bg-white p-6 shadow-[0_10px_30px_rgba(65,39,75,.06)]">
      <h3 className="text-base font-black text-[#403344]">
        Resumen
      </h3>

      <div className="mt-5 space-y-3 border-b border-[#eee7f0] pb-5">
        <div className="flex justify-between text-sm">
          <span className="text-[#7b707f]">Productos</span>
          <span className="font-bold text-[#403344]">
            Bs {subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#7b707f]">Envío</span>
          <span className="text-xs font-bold text-[#8b7a91]">
            A coordinar
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-black text-[#403344]">
          Total
        </span>

        <span className="text-xl font-black text-[#65358e]">
          Bs {subtotal.toFixed(2)}
        </span>
      </div>

      {onCheckout ? (
        <button
          type="button"
          onClick={onCheckout}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition hover:bg-[#572d7a]"
        >
          Continuar
          <ArrowRight size={16} />
        </button>
      ) : (
        <Link
          href="/pedido/datos"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition hover:bg-[#572d7a]"
        >
          Continuar
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}