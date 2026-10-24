"use client";

import { BrandLogo } from "../storefront-media";
import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronRight, Flower2, Leaf, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { scrollToId, useDialog } from "./shared";

export type NavItem = { label: string; href: string; onNavigate?: () => void };

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
      <div className="relative min-w-0 flex-1">
        <Search
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b5965]"
        />

        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar flores, regalos…"
          aria-label="Buscar productos"
          maxLength={200}
          autoFocus={autoFocus}
          className="h-12 w-full rounded-xl border border-[#d9bfc6] bg-white pl-11 pr-4 text-sm text-[#392b38] outline-none transition placeholder:text-[#726875] focus:border-[#873c58] focus:ring-4 focus:ring-[#873c58]/10"
        />
      </div>

      <button
        type="submit"
        className="h-12 rounded-xl bg-[#873c58] px-5 text-sm font-black text-white transition hover:bg-[#713048]"
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
          className="fixed inset-0 z-[100] bg-[#392b38]/35 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <div
            ref={menuRef}
            id="menu-principal-movil"
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            tabIndex={-1}
            className="anabelle-mobile-menu absolute right-0 top-0 flex h-full w-[94%] max-w-[420px] flex-col overflow-y-auto bg-[#fff9f4] px-5 py-5 shadow-2xl sm:px-7"
          >
            <div className="flex items-center justify-between border-b border-[#e8dfea] pb-5">
              <BrandLogo className="h-14 max-w-[190px]"/>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-11 items-center justify-center rounded-xl border border-[#e6dce8] text-[#55485b] transition hover:bg-[#fbf2ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873c58] focus-visible:ring-offset-2"
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

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[.16em] text-[#6b5965]">Explora Anabelle</p>
            <nav aria-label="Principal móvil" className="mt-3 flex flex-col gap-1">
              {navItems.map(({ label, href, onNavigate }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => { onNavigate?.(); setMenuOpen(false); }}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold transition hover:bg-[#f3e3e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873c58] focus-visible:ring-offset-2 ${label === "Catálogo" ? "bg-[#f3e3e5] text-[#873c58]" : "text-[#392b38]"}`}
                >
                  {label}
                  <ChevronRight size={16} aria-hidden className="shrink-0 text-[#873c58]"/>
                </a>
              ))}

            </nav>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e6d7d8] pt-5">
              <button
                type="button"
                onClick={() => {
                  onToggleFavorites();
                  setMenuOpen(false);
                  scrollToId("catalogo");
                }}
                aria-pressed={favoritesActive}
                className="flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#e6d7d8] bg-white p-3 text-sm font-bold text-[#873c58]"
              >
                <Heart size={18} aria-hidden/><span>Favoritos</span>

                <span className="text-xs text-[#6b5965]">{favoritesCount}</span>
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onOpenCart(); }} className="flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#873c58] p-3 text-sm font-bold text-white"><ShoppingBag size={18} aria-hidden/>Mi carrito <span className="tabular-nums">({cartCount})</span></button>
            </div>
            <p className="mt-auto pt-6 text-center text-xs leading-5 text-[#6b5965]">Flores que acompañan tus momentos.</p>
          </div>
        </div>
      ) : null}

      {/* ENCABEZADO */}
      <header className="anabelle-brand-header sticky top-0 z-50">
        <div className="anabelle-header-botanical anabelle-header-botanical-left" aria-hidden="true"><Flower2/><Leaf/></div>
        <div className="anabelle-header-botanical anabelle-header-botanical-right" aria-hidden="true"><Leaf/><Flower2/></div>
        <div className="anabelle-header-bar relative mx-auto flex min-h-[78px] max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-5 xl:gap-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#e5dce7] text-[#4b3d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873c58] focus-visible:ring-offset-2 lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="menu-principal-movil"
            aria-haspopup="dialog"
          >
            <Menu size={20} />
          </button>

          <a href="#inicio" aria-label="Floristería Anabelle · Inicio" className="anabelle-header-logo flex min-w-0 shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873c58] focus-visible:ring-offset-2"><BrandLogo className="h-14 max-w-[164px] sm:h-16 sm:max-w-[188px] xl:h-[72px] xl:max-w-[212px]"/>
          </a>

          <nav
            aria-label="Principal"
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1.5 2xl:gap-2"
          >
            {navItems.map(({ label, href, onNavigate }) => (
              <a
                key={label}
                href={href}
                onClick={onNavigate}
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2 text-[12px] font-bold text-[#574b5c] transition-colors hover:bg-[#f0d9e3] hover:text-[#873c58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873c58] focus-visible:ring-offset-2 xl:text-[13px]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              aria-expanded={searchOpen}
              aria-controls="buscador"
              className="hidden size-10 items-center justify-center rounded-xl text-[#504455] transition hover:bg-[#fbf2ef] sm:flex"
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
              className={`relative flex size-10 items-center justify-center rounded-xl transition hover:bg-[#fbf2ef] ${
                favoritesActive ? "text-[#873c58]" : "text-[#504455]"
              }`}
              aria-label={`Mis favoritos (${favoritesCount})`}
            >
              <Heart
                size={19}
                strokeWidth={1.8}
                className={favoritesActive ? "fill-current" : ""}
              />

              {favoritesCount > 0 ? (
                <span key={favoritesCount} className="nova-value absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#873c58] text-[9px] font-black text-white">
                  {favoritesCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex size-10 items-center justify-center rounded-xl text-[#873c58] transition hover:bg-[#fbf2ef]"
              aria-label={
                cartCount > 0
                  ? `Abrir carrito (${cartCount} productos)`
                  : "Abrir carrito"
              }
            >
              <ShoppingBag size={20} strokeWidth={1.8} />

              {cartCount > 0 ? (
                <span key={cartCount} className="nova-value absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#873c58] text-[9px] font-black text-white">
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
