import { ArrowRight, Gift, Sparkles } from "lucide-react";
import Link from "next/link";

export function PromotionSection() {
  return (
    <section
      id="promociones"
      className="border-y border-[#e8e0ea] bg-[#f6f0f8] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <div className="grid overflow-hidden rounded-3xl border border-[#ded2e2] bg-white lg:grid-cols-[1.2fr_.8fr]">
          <div className="px-7 py-10 sm:px-10 sm:py-12 lg:px-14">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#f3ebf6] text-[#65358e]">
                <Gift size={19} />
              </span>

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
                Promociones NOVA
              </span>
            </div>

            <h2 className="max-w-xl text-3xl font-black leading-tight text-[#403344] sm:text-4xl">
              Un detalle especial para cada ocasión
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#756a79] sm:text-base">
              Descubre nuestros arreglos destacados y encuentra una opción
              pensada para celebrar, agradecer o simplemente sorprender.
            </p>

            <Link
              href="/catalogo"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition hover:-translate-y-0.5 hover:bg-[#572d7a]"
            >
              Explorar promociones
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative min-h-[260px] overflow-hidden bg-[#e7dce9] lg:min-h-full">
            <div className="absolute inset-6 border border-white/70" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-40 items-center justify-center rounded-full bg-white/70 shadow-[0_20px_45px_rgba(65,39,75,.10)]">
                <Sparkles
                  size={56}
                  strokeWidth={1.2}
                  className="text-[#8d6a99]"
                />
              </div>
            </div>

            <div className="absolute bottom-6 left-6 rounded-xl border border-white/80 bg-white px-5 py-4 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7a91]">
                NOVA
              </p>

              <p className="mt-1 text-sm font-black text-[#433548]">
                Momentos que florecen
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}