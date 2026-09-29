"use client";

import { ArrowRight } from "lucide-react";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const racingScript = dancingScript;

export function Hero() {
  return (
    <section
      id="inicio"
      className="border-b border-[#e8e0ea] bg-[#f6f0f8]"
    >
      <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[1fr_1fr]">
        <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="max-w-[580px]">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[#9270a4]" />

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
                NOVA FLORERÍA
              </span>
            </div>

            <h1
              className={`${racingScript.className} text-[64px] leading-[0.9] text-[#4c285f] sm:text-[80px] lg:text-[92px]`}
            >
              Flores
              <br />
              que hablan
            </h1>

            <p className="mt-7 max-w-[490px] text-[15px] leading-7 text-[#6e6372] sm:text-base">
              Arreglos florales, regalos y detalles diseñados para acompañar
              los momentos que quieres recordar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/catalogo"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition hover:-translate-y-0.5 hover:bg-[#572d7a]"
              >
                Explorar catálogo
                <ArrowRight size={16} />
              </a>

              <a
                href="/#promociones"
                className="inline-flex h-12 items-center rounded-xl border border-[#d8c8de] bg-white px-6 text-sm font-bold text-[#55455c] transition hover:border-[#65358e] hover:text-[#65358e]"
              >
                Ver promociones
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 border-t border-[#ded2e2] pt-6">
              <div>
                <p className="text-lg font-black text-[#403344]">+100</p>

                <p className="mt-1 text-xs text-[#7c7080]">
                  arreglos creados
                </p>
              </div>

              <div className="h-10 w-px bg-[#ded2e2]" />

              <div>
                <p className="text-lg font-black text-[#403344]">100%</p>

                <p className="mt-1 text-xs text-[#7c7080]">
                  dedicación
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* HERO IMAGE */}
        <div className="relative min-h-[500px] bg-[#e7dce9] lg:min-h-[620px]">
          <div className="absolute inset-6 border border-white/70 sm:inset-10" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[72%] max-w-[420px]">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#d9c9df] shadow-[0_25px_60px_rgba(65,39,75,.12)]">
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="text-[120px] opacity-80">✿</div>

                  <p
                    className={`${racingScript.className} mt-3 text-5xl text-[#694778]`}
                  >
                    Tu momento
                  </p>

                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#78627f]">
                    imagen principal
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 hidden rounded-xl border border-white/80 bg-white px-5 py-4 shadow-lg sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7a91]">
              Detalles especiales
            </p>

            <p className="mt-1 text-sm font-black text-[#433548]">
              Hechos para ti
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}