"use client";

import { useState } from "react";
import { Dancing_Script } from "next/font/google";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";

const dancingScript = Dancing_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const racingScript = dancingScript;

const navigation = [
  ["Inicio", "/"],
  ["Catálogo", "/catalogo"],
  ["Promociones", "/#promociones"],
  ["Nosotros", "/#nosotros"],
  ["Contacto", "/#contacto"],
];

type PublicHeaderProps = {
  cartCount?: number;
  onCartOpen?: () => void;
};

export function PublicHeader({
  cartCount = 0,
  onCartOpen,
}: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* MOBILE MENU */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[100] bg-[#28202d]/35 lg:hidden">
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white px-6 py-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e8dfea] pb-5">
              <div>
                <p
                  className={`${racingScript.className} text-[34px] leading-none text-[#65358e]`}
                >
                  NOVA
                </p>

                <p className="mt-1 text-[8px] font-black tracking-[0.28em] text-[#87758d]">
                  FLORERÍA
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl border border-[#e6dce8] text-[#55485b] transition hover:bg-[#f5eff7]"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col">
              {navigation.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-[#eee8f0] py-4 text-sm font-bold text-[#44384a] transition hover:text-[#65358e]"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#e7dfe9] bg-white">
        <div className="mx-auto flex h-[74px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e5dce7] text-[#4b3d50] lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <a href="/" className="flex shrink-0 items-center">
            <div>
              <div
                className={`${racingScript.className} text-[36px] leading-none text-[#65358e]`}
              >
                NOVA
              </div>

              <div className="mt-1 text-[8px] font-black tracking-[0.34em] text-[#817284]">
                FLORERÍA
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navigation.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-[13px] font-bold text-[#574b5c] transition-colors hover:text-[#65358e]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden size-10 items-center justify-center rounded-xl text-[#504455] transition hover:bg-[#f5eff7] sm:flex"
              aria-label="Buscar"
            >
              <Search size={19} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              className="hidden size-10 items-center justify-center rounded-xl text-[#504455] transition hover:bg-[#f5eff7] sm:flex"
              aria-label="Favoritos"
            >
              <Heart size={19} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={onCartOpen}
              className="relative flex size-10 items-center justify-center rounded-xl text-[#65358e] transition hover:bg-[#f5eff7]"
              aria-label="Abrir carrito"
            >
              <ShoppingBag size={20} strokeWidth={1.8} />

              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#65358e] text-[9px] font-black text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}