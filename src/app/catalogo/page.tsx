// src/app/prueba-cliente/page.tsx
"use client";

import { useState } from "react";
import { Dancing_Script, Lato } from "next/font/google";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,s
  X,
} from "lucide-react";



const lato = Lato({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});
const dancingScript = Dancing_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const racingScript = dancingScript;
const products = [
  {
    name: "Ramo de rosas rojas",
    price: "Bs 150",
    category: "Ramos",
    image: "RO",
    imageClass: "bg-[#ead9df]",
  },
  {
    name: "Ramo de 20 rosas",
    price: "Bs 200",
    category: "Ramos",
    image: "20",
    imageClass: "bg-[#e5ddec]",
  },
  {
    name: "Regalo Sorpresa",
    price: "Bs 210",
    category: "Regalos",
    image: "RS",
    imageClass: "bg-[#eee4d7]",
  },
  {
    name: "Oso de 25 cm",
    price: "Bs 45",
    category: "Detalles",
    image: "OS",
    imageClass: "bg-[#e7e1d8]",
  },
];

const categories = [
  "Todos",
  "Ramos",
  "Rosas",
  "Regalos",
  "Detalles",
];

export default function PruebaClientePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");

  const visibleProducts =
    activeCategory === "Todos"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <main
      className={`${lato.className} min-h-screen bg-[#faf8fb] text-[#28202d]`}
    >
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
              {[
                ["Inicio", "#inicio"],
                ["Catálogo", "#catalogo"],
                ["Promociones", "#promociones"],
                ["Nosotros", "#nosotros"],
                ["Contacto", "#contacto"],
              ].map(([label, href]) => (
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

          <a href="#inicio" className="flex shrink-0 items-center">
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
            {[
              ["Inicio", "#inicio"],
              ["Catálogo", "#catalogo"],
              ["Promociones", "#promociones"],
              ["Nosotros", "#nosotros"],
              ["Contacto", "#contacto"],
            ].map(([label, href]) => (
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
              onClick={() => setCartOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-xl text-[#65358e] transition hover:bg-[#f5eff7]"
              aria-label="Abrir carrito"
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#65358e] text-[9px] font-black text-white">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="inicio" className="border-b border-[#e8e0ea] bg-[#f6f0f8]">
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
                  href="#catalogo"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition hover:-translate-y-0.5 hover:bg-[#572d7a]"
                >
                  Explorar catálogo
                  <ArrowRight size={16} />
                </a>

                <a
                  href="#promociones"
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

          {/* HERO IMAGE PLACEHOLDER */}
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

      {/* SERVICE STRIP */}
      <section className="border-b border-[#e8e0ea] bg-white">
        <div className="mx-auto grid max-w-[1100px] sm:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Entrega coordinada",
              text: "Llevamos tu pedido hasta donde necesitas.",
            },
            {
              icon: Sparkles,
              title: "Detalles especiales",
              text: "Cada arreglo se prepara con dedicación.",
            },
            {
              icon: Heart,
              title: "Compra segura",
              text: "Un proceso simple y claro para ti.",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`flex items-center gap-4 px-7 py-6 ${
                  index > 0 ? "border-t border-[#eee7f0] sm:border-l sm:border-t-0" : ""
                }`}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f3ebf6] text-[#65358e]">
                  <Icon size={19} strokeWidth={1.7} />
                </div>

                <div>
                  <p className="text-sm font-black text-[#403344]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7b707f]">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalogo" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#806a88]">
                Catálogo
              </p>

              <h2
                className={`${racingScript.className} mt-2 text-[52px] leading-none text-[#4c285f] sm:text-[64px]`}
              >
                Elige tu detalle
              </h2>

              <p className="mt-3 max-w-[500px] text-sm leading-6 text-[#756a79]">
                Encuentra flores y regalos para cada ocasión.
              </p>
            </div>

            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
                    activeCategory === category
                      ? "border-[#65358e] bg-[#65358e] text-white"
                      : "border-[#ddd1e1] bg-white text-[#65576a] hover:border-[#bda8c5] hover:text-[#65358e]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {visibleProducts.map((product) => (
              <article key={product.name} className="group min-w-0">
                <div
                  className={`relative aspect-[4/5] overflow-hidden rounded-2xl ${product.imageClass}`}
                >
                  <button
                    type="button"
                    className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-xl border border-white/70 bg-white text-[#66596b] shadow-sm transition hover:text-[#65358e]"
                    aria-label={`Agregar ${product.name} a favoritos`}
                  >
                    <Heart size={16} strokeWidth={1.8} />
                  </button>

                  <div className="flex h-full items-center justify-center transition duration-500 group-hover:scale-105">
                    <div className="flex size-[62%] items-center justify-center rounded-full border border-white/50 bg-white/20">
                      <span
                        className={`${racingScript.className} text-5xl text-[#73547f]`}
                      >
                        {product.image}
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6e6073] shadow-sm">
                    {product.category}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black leading-5 text-[#403344]">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#ded2e2] text-[#65358e] transition hover:bg-[#f3ebf6]"
                      aria-label={`Agregar ${product.name}`}
                    >
                      <ShoppingBag size={15} strokeWidth={1.8} />
                    </button>
                  </div>

                  <p className="mt-2 text-sm font-black text-[#65358e]">
                    {product.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOTION */}
      <section id="promociones" className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid overflow-hidden rounded-2xl border border-[#e2d5e5] bg-white lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex items-center bg-[#eee5f1] px-7 py-12 sm:px-12 lg:px-16">
              <div>
                <span className="inline-flex rounded-full bg-[#65358e] px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                  Promoción
                </span>

                <h2
                  className={`${racingScript.className} mt-5 text-[54px] leading-[.95] text-[#4c285f] sm:text-[68px]`}
                >
                  Un detalle
                  <br />
                  para recordar
                </h2>

                <p className="mt-5 max-w-[450px] text-sm leading-6 text-[#706374]">
                  Descubre nuestras opciones de regalo y crea una combinación
                  especial para esa persona.
                </p>

                <button
                  type="button"
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#65358e] px-5 text-sm font-black text-white transition hover:bg-[#572d7a]"
                >
                  Ver promoción
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="flex min-h-[360px] items-center justify-center bg-[#f5eef7]">
              <div className="aspect-[4/5] w-[54%] rounded-2xl bg-[#e1d2e5] shadow-[0_20px_45px_rgba(65,39,75,.1)]">
                <div className="flex h-full flex-col items-center justify-center">
                  <span className="text-7xl text-[#785682]">✿</span>
                  <p
                    className={`${racingScript.className} mt-4 text-4xl text-[#684572]`}
                  >
                    colección
                  </p>
                  <span className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#806d86]">
                    imagen promocional
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT DETAIL */}
      <section className="border-y border-[#e8e0ea] bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#806a88]">
              Vista de producto
            </p>
            <h2
              className={`${racingScript.className} mt-2 text-[50px] leading-none text-[#4c285f]`}
            >
              Detalle
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div className="grid grid-cols-[84px_1fr] gap-4">
              <div className="space-y-3">
                <div className="aspect-square rounded-xl border-2 border-[#65358e] bg-[#ead9df]" />
                <div className="aspect-square rounded-xl border border-[#ded2e2] bg-[#e5ddec]" />
                <div className="aspect-square rounded-xl border border-[#ded2e2] bg-[#eee4d7]" />
              </div>

              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#ead9df]">
                <div className="flex h-full items-center justify-center">
                  <div className="flex size-[55%] items-center justify-center rounded-full border border-white/60 bg-white/20">
                    <span
                      className={`${racingScript.className} text-7xl text-[#76547f]`}
                    >
                      RO
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#846f8c]">
                Ramos
              </span>

              <h3
                className={`${racingScript.className} mt-3 text-[55px] leading-none text-[#4c285f]`}
              >
                Ramo de
                <br />
                rosas rojas
              </h3>

              <p className="mt-5 text-2xl font-black text-[#65358e]">
                Bs 150
              </p>

              <p className="mt-5 max-w-[480px] text-sm leading-7 text-[#706474]">
                Un arreglo pensado para expresar cariño y celebrar momentos
                importantes.
              </p>

              <div className="mt-7 border-y border-[#e9e1eb] py-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#5b4d60]">
                  Cantidad
                </p>

                <div className="mt-3 inline-flex items-center rounded-xl border border-[#ded2e2]">
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center text-[#5c4e61]"
                  >
                    −
                  </button>
                  <span className="flex size-10 items-center justify-center border-x border-[#ded2e2] text-sm font-black">
                    1
                  </span>
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center text-[#5c4e61]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#65358e] text-sm font-black text-white transition hover:bg-[#572d7a]"
                >
                  <ShoppingBag size={17} />
                  Agregar al carrito
                </button>

                <button
                  type="button"
                  className="flex h-12 items-center justify-center rounded-xl border border-[#d8cadd] px-5 text-[#65358e] transition hover:bg-[#f5eff7]"
                  aria-label="Agregar a favoritos"
                >
                  <Heart size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="nosotros" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1100px] overflow-hidden rounded-2xl border border-[#e2d7e4] bg-white lg:grid-cols-2">
          <div className="flex min-h-[390px] items-center justify-center bg-[#f2eaf4]">
            <div className="text-center">
              <div className="mx-auto flex size-36 items-center justify-center rounded-full border border-[#d9c7df] bg-[#e8dceb]">
                <span className="text-6xl text-[#704b7d]">✿</span>
              </div>
              <p
                className={`${racingScript.className} mt-5 text-5xl text-[#5d3a69]`}
              >
                NOVA
              </p>
            </div>
          </div>

          <div className="flex items-center px-7 py-12 sm:px-12 lg:px-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#806a88]">
                Nosotros
              </p>

              <h2
                className={`${racingScript.className} mt-3 text-[52px] leading-[.95] text-[#4c285f]`}
              >
                Hecho con
                <br />
                intención
              </h2>

              <p className="mt-6 text-sm leading-7 text-[#706474]">
                Cada producto de NOVA busca transmitir una emoción. Cuidamos
                la selección, presentación y cada pequeño detalle para que
                regalar sea una experiencia.
              </p>

              <button
                type="button"
                className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#65358e]"
              >
                Conoce más
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contacto" className="border-t border-[#e8e0ea] bg-[#f6f0f8] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[700px] text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#806a88]">
            Mantente cerca
          </p>

          <h2
            className={`${racingScript.className} mt-3 text-[55px] leading-none text-[#4c285f]`}
          >
            Recibe nuestras novedades
          </h2>

          <p className="mx-auto mt-4 max-w-[500px] text-sm leading-6 text-[#706474]">
            Nuevos productos, promociones y detalles especiales de NOVA.
          </p>

          <div className="mx-auto mt-7 flex max-w-[500px] flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="h-12 flex-1 rounded-xl border border-[#d8cadd] bg-white px-4 text-sm text-[#403344] outline-none transition placeholder:text-[#9a8d9e] focus:border-[#65358e] focus:ring-4 focus:ring-[#65358e]/10"
            />

            <button
              type="button"
              className="h-12 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white transition hover:bg-[#572d7a]"
            >
              Suscribirme
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#28202d] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p
              className={`${racingScript.className} text-[42px] leading-none`}
            >
              NOVA
            </p>
            <p className="mt-1 text-[8px] font-black tracking-[0.32em] text-white/45">
              FLORERÍA
            </p>
            <p className="mt-5 max-w-[260px] text-xs leading-6 text-white/50">
              Flores, regalos y detalles para acompañar tus momentos
              especiales.
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white/80">
              Catálogo
            </p>
            <div className="mt-4 flex flex-col gap-3 text-xs text-white/50">
              <a href="#catalogo" className="hover:text-white">
                Ramos
              </a>
              <a href="#catalogo" className="hover:text-white">
                Rosas
              </a>
              <a href="#catalogo" className="hover:text-white">
                Regalos
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white/80">
              Información
            </p>
            <div className="mt-4 flex flex-col gap-3 text-xs text-white/50">
              <span>Entregas</span>
              <span>Medios de pago</span>
              <span>Preguntas frecuentes</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white/80">
              Contacto
            </p>
            <div className="mt-4 flex flex-col gap-3 text-xs text-white/50">
              <span>WhatsApp</span>
              <span>Instagram</span>
              <span>Horario de atención</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-6 text-center text-[11px] text-white/30">
          © 2026 NOVA FLORERÍA
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen ? (
        <div className="fixed inset-0 z-[110] bg-[#28202d]/40 backdrop-blur-[2px]">
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e7dfe9] px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#806a88]">
                  Tu compra
                </p>
                <h2
                  className={`${racingScript.className} mt-1 text-[46px] leading-none text-[#4c285f]`}
                >
                  Carrito
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl border border-[#e1d6e3] text-[#55485b] transition hover:bg-[#f5eff7]"
                aria-label="Cerrar carrito"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {[
                {
                  name: "Ramo de rosas rojas",
                  price: "Bs 150",
                  tone: "bg-[#ead9df]",
                  label: "RO",
                },
                {
                  name: "Regalo Sorpresa",
                  price: "Bs 210",
                  tone: "bg-[#eee4d7]",
                  label: "RS",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex gap-4 border-b border-[#eee7f0] py-5 first:pt-0"
                >
                  <div
                    className={`flex size-[76px] shrink-0 items-center justify-center rounded-xl ${item.tone}`}
                  >
                    <span
                      className={`${racingScript.className} text-3xl text-[#76547f]`}
                    >
                      {item.label}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#403344]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-[#837685]">
                      Cantidad: 1
                    </p>
                    <p className="mt-2 text-sm font-black text-[#65358e]">
                      {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#e7dfe9] px-6 py-6">
              <div className="flex items-center justify-between text-sm text-[#706474]">
                <span>Subtotal</span>
                <span>Bs 360</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-lg font-black text-[#403344]">
                <span>Total</span>
                <span>Bs 360</span>
              </div>

              <button
                type="button"
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65358e] text-sm font-black text-white transition hover:bg-[#572d7a]"
              >
                Continuar compra
                <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}