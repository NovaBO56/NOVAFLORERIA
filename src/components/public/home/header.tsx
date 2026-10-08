"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { script, scrollToId, useDialog } from "./shared";

export type NavItem = { label: string; href: string };

type SiteHeaderProps = {
  navItems: NavItem[];
  cartCount: number;
  favoritesCount: number;
  favoritesActive: boolean;
  searchTerm: string;
  onSearch: (term: string) => void;
  onToggleFavorites: () => void;
  onOpenCart: () => void;
};

/** Buscador. Se vuelve a montar (key) cuando la búsqueda cambia desde fuera. */
function SearchForm({
  initialValue,
  onSubmit,
  autoFocus = false,
}: {
  initialValue: string;
  onSubmit: (term: string) => void;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(draft.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-2">
      <div className="relative flex-1">
        <Search
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#736877]"
        />

        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar flores, regalos…"
          aria-label="Buscar productos"
          maxLength={200}
          autoFocus={autoFocus}
          className="h-12 w-full rounded-xl border border-[#d8cadd] bg-white pl-11 pr-4 text-sm text-[#403344] outline-none transition placeholder:text-[#726875] focus:border-[#65358e] focus:ring-4 focus:ring-[#65358e]/10"
        />
      </div>

      <button
        type="submit"
        className="h-12 rounded-xl bg-[#65358e] px-5 text-sm font-black text-white transition hover:bg-[#572d7a]"
      >
        Buscar
      </button>
    </form>
  );
}

export function SiteHeader({
  navItems,
  cartCount,
  favoritesCount,
  favoritesActive,
  searchTerm,
  onSearch,
  onToggleFavorites,
  onOpenCart,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const menuRef = useDialog<HTMLDivElement>(menuOpen, () =>
    setMenuOpen(false),
  );

  function submitSearch(term: string) {
    onSearch(term);
    setSearchOpen(false);
    setMenuOpen(false);
    scrollToId("catalogo");
  }

  return (
    <>
      {/* MENÚ MÓVIL */}
      {menuOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-[#28202d]/35 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-white px-6 py-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#e8dfea] pb-5">
              <div>
                <p
                  className={`${script.className} text-[34px] leading-none text-[#65358e]`}
                >
                  Anabelle
                </p>

                <p className="mt-1 text-[8px] font-black tracking-[0.28em] text-[#76667b]">
                  FLORISTERÍA
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

            <div className="mt-6">
              <SearchForm
                key={searchTerm}
                initialValue={searchTerm}
                onSubmit={submitSearch}
              />
            </div>

            <nav className="mt-4 flex flex-col">
              {navItems.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-[#eee8f0] py-4 text-sm font-bold text-[#44384a] transition hover:text-[#65358e]"
                >
                  {label}
                </a>
              ))}

              <button
                type="button"
                onClick={() => {
                  onToggleFavorites();
                  setMenuOpen(false);
                  scrollToId("catalogo");
                }}
                aria-pressed={favoritesActive}
                className="flex items-center justify-between border-b border-[#eee8f0] py-4 text-left text-sm font-bold text-[#44384a] transition hover:text-[#65358e]"
              >
                <span>Mis favoritos</span>

                <span className="text-xs text-[#736877]">{favoritesCount}</span>
              </button>
            </nav>
          </div>
        </div>
      ) : null}

      {/* ENCABEZADO */}
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

          <a href="#inicio" className="flex shrink-0 items-center">
            <div>
              <div
                className={`${script.className} text-[36px] leading-none text-[#65358e]`}
              >
                Anabelle
              </div>

              <div className="mt-1 text-[8px] font-black tracking-[0.34em] text-[#756777]">
                FLORISTERÍA
              </div>
            </div>
          </a>

          <nav
            aria-label="Principal"
            className="hidden items-center gap-8 lg:flex"
          >
            {navItems.map(({ label, href }) => (
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
              onClick={() => setSearchOpen((current) => !current)}
              aria-expanded={searchOpen}
              aria-controls="buscador"
              className="hidden size-10 items-center justify-center rounded-xl text-[#504455] transition hover:bg-[#f5eff7] sm:flex"
              aria-label="Buscar"
            >
              <Search size={19} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleFavorites();
                scrollToId("catalogo");
              }}
              aria-pressed={favoritesActive}
              className={`relative hidden size-10 items-center justify-center rounded-xl transition hover:bg-[#f5eff7] sm:flex ${
                favoritesActive ? "text-[#65358e]" : "text-[#504455]"
              }`}
              aria-label={`Mis favoritos (${favoritesCount})`}
            >
              <Heart
                size={19}
                strokeWidth={1.8}
                className={favoritesActive ? "fill-current" : ""}
              />

              {favoritesCount > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#65358e] text-[9px] font-black text-white">
                  {favoritesCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex size-10 items-center justify-center rounded-xl text-[#65358e] transition hover:bg-[#f5eff7]"
              aria-label={
                cartCount > 0
                  ? `Abrir carrito (${cartCount} productos)`
                  : "Abrir carrito"
              }
            >
              <ShoppingBag size={20} strokeWidth={1.8} />

              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#65358e] text-[9px] font-black text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div id="buscador" className="border-t border-[#eee7f0] bg-white">
            <div className="mx-auto max-w-[1280px] px-5 py-4 sm:px-8">
              <SearchForm
                key={searchTerm}
                initialValue={searchTerm}
                onSubmit={submitSearch}
                autoFocus
              />
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}