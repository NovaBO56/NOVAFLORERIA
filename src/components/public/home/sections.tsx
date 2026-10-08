"use client";
import { PublicStoreLocation } from "../store-location";

import { useState } from "react";
import { SafeImage as Image } from "@/components/public/safe-image";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Heart,
  MessageCircle,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  DAY_NAMES,
  dayHoursLabel,
  formatMoney,
  orderedWeek,
  pickImage,
  promotionBenefit,
  promotionValidity,
  todayHoursLabel,
} from "@/lib/public/format";
import type {
  BusinessStatus,
  PublicCategory,
  PublicProduct,
  PublicPromotion,
  WeekDay,
} from "@/lib/public/types";
import { script } from "./shared";

/* ============================================================
   AVISO DE LOCAL CERRADO
   ============================================================ */

export function ClosedBanner({ status }: { status: BusinessStatus | null }) {
  if (!status || status.is_open) return null;

  const hours = todayHoursLabel(status);

  return (
    <div role="status" className="bg-[#4c285f] px-5 py-2.5 text-center text-xs text-white">
      <span className="font-black">Estamos cerrados en este momento.</span>{" "}
      {status.accept_orders_outside_hours
        ? "Puedes dejar tu pedido y lo atenderemos en cuanto abramos."
        : hours && hours !== "Cerrado"
          ? `Horario de hoy: ${hours}.`
          : "Hoy no atendemos."}
    </div>
  );
}

/* ============================================================
   PORTADA
   ============================================================ */

export function HeroSection({
  totalProducts,
  status,
  heroProduct,
  hasPromotions,
}: {
  totalProducts: number | null;
  status: BusinessStatus | null;
  heroProduct: PublicProduct | null;
  hasPromotions: boolean;
}) {
  const heroImage = heroProduct ? pickImage(heroProduct) : null;
  const hours = todayHoursLabel(status);

  return (
    <section id="inicio" className="scroll-mt-20 border-b border-[#e8e0ea] bg-[#f6f0f8]">
      <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[1fr_1fr]">
        <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="max-w-[580px]">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[#9270a4]" />

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
                Floristería Anabelle
              </span>
            </div>

            <h1
              className={`${script.className} text-[64px] leading-[0.9] text-[#4c285f] sm:text-[80px] lg:text-[92px]`}
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
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white shadow-[0_8px_20px_rgba(101,53,142,.18)] transition motion-safe:hover:-translate-y-0.5 hover:bg-[#572d7a]"
              >
                Explorar catálogo
                <ArrowRight size={16} />
              </a>

              {hasPromotions ? (
                <a
                  href="#promociones"
                  className="inline-flex h-12 items-center rounded-xl border border-[#d8c8de] bg-white px-6 text-sm font-bold text-[#55455c] transition hover:border-[#65358e] hover:text-[#65358e]"
                >
                  Ver promociones
                </a>
              ) : null}
            </div>

            <div className="mt-10 flex flex-wrap gap-6 border-t border-[#ded2e2] pt-6">
              <div>
                <p className="text-lg font-black text-[#403344]">
                  {totalProducts ?? "—"}
                </p>

                <p className="mt-1 text-xs text-[#736877]">
                  productos en el catálogo
                </p>
              </div>

              <div className="h-10 w-px bg-[#ded2e2]" />

              <div>
                <p className="text-lg font-black text-[#403344]">
                  {hours ?? "—"}
                </p>

                <p className="mt-1 text-xs text-[#736877]">horario de hoy</p>
              </div>
            </div>
          </div>
        </div>

        {/* IMAGEN PRINCIPAL: foto de un producto destacado si existe */}
        <div className="relative min-h-[500px] bg-[#e7dce9] lg:min-h-[620px]">
          <div className="absolute inset-6 border border-white/70 sm:inset-10" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[72%] max-w-[420px]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#d9c9df] shadow-[0_25px_60px_rgba(65,39,75,.12)]">
                {heroImage ? (
                  <>
                    <Image
                      src={heroImage.public_url}
                      alt={heroImage.alt_text ?? heroProduct?.name ?? "Producto destacado"}
                      fill
                      priority
                      sizes="(min-width: 1024px) 420px, 72vw"
                      className="object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#28202d]/55 to-transparent px-6 pb-6 pt-16">
                      <p className={`${script.className} text-right text-4xl text-white`}>
                        Tu momento
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="text-[120px] opacity-80">✿</div>

                    <p
                      className={`${script.className} mt-3 text-5xl text-[#694778]`}
                    >
                      Tu momento
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 hidden rounded-xl border border-white/80 bg-white px-5 py-4 shadow-lg sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#75677b]">
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

/* ============================================================
   FRANJA DE SERVICIOS
   ============================================================ */

const services = [
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
];

export function ServiceStrip() {
  return (
    <section className="border-b border-[#e8e0ea] bg-white">
      <div className="mx-auto grid max-w-[1100px] sm:grid-cols-3">
        {services.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`flex items-center gap-4 px-7 py-6 ${
                index > 0
                  ? "border-t border-[#eee7f0] sm:border-l sm:border-t-0"
                  : ""
              }`}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f3ebf6] text-[#65358e]">
                <Icon size={19} strokeWidth={1.7} />
              </div>

              <div>
                <p className="text-sm font-black text-[#403344]">
                  {item.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#726876]">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   PROMOCIONES (datos reales de /api/promotions)
   ============================================================ */

const DEFAULT_PROMOTION_TEXT =
  "Descubre nuestras opciones de regalo y crea una combinación especial para esa persona.";

export function PromotionSection({
  promotions,
}: {
  promotions: PublicPromotion[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (promotions.length === 0) return null;

  const promotion =
    promotions.find((entry) => entry.id === activeId) ?? promotions[0];

  const validity = promotionValidity(promotion);
  const benefit = promotionBenefit(promotion);

  return (
    <section
      id="promociones"
      className="scroll-mt-20 px-5 pb-16 sm:px-8 sm:pb-20"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="grid overflow-hidden rounded-2xl border border-[#e2d5e5] bg-white lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex items-center bg-[#eee5f1] px-7 py-12 sm:px-12 lg:px-16">
            <div>
              <span className="inline-flex rounded-full bg-[#65358e] px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                Promoción
              </span>

              <h2
                className={`${script.className} mt-5 break-words leading-[.95] text-[#4c285f] ${
                  promotion.name.length > 22
                    ? "text-[44px] sm:text-[52px]"
                    : "text-[54px] sm:text-[68px]"
                }`}
              >
                {promotion.name}
              </h2>

              <p className="mt-5 max-w-[450px] text-sm leading-6 text-[#6a5e6e]">
                {promotion.description || DEFAULT_PROMOTION_TEXT}
              </p>

              <p className="mt-4 text-sm font-black text-[#65358e]">
                {benefit}
                {promotion.minimum_purchase !== null
                  ? ` · compra mínima ${formatMoney(promotion.minimum_purchase)}`
                  : ""}
              </p>

              {validity ? (
                <p className="mt-1 text-xs text-[#6a5e6e]">{validity}</p>
              ) : null}

              {promotions.length > 1 ? (
                <div
                  className="mt-5 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Otras promociones"
                >
                  {promotions.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setActiveId(entry.id)}
                      aria-pressed={entry.id === promotion.id}
                      className={`min-h-10 rounded-full px-3 py-2 text-[11px] font-black transition ${
                        entry.id === promotion.id
                          ? "bg-[#65358e] text-white"
                          : "border border-[#d8c8de] bg-white text-[#66596b] hover:border-[#65358e] hover:text-[#65358e]"
                      }`}
                    >
                      {entry.name}
                    </button>
                  ))}
                </div>
              ) : null}

              <a
                href="#catalogo"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#65358e] px-5 text-sm font-black text-white transition hover:bg-[#572d7a]"
              >
                Ver productos
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          <div className="flex min-h-[360px] items-center justify-center bg-[#f5eef7]">
            <div className="aspect-[4/5] w-[54%] rounded-2xl bg-[#e1d2e5] shadow-[0_20px_45px_rgba(65,39,75,.1)]">
              <div className="flex h-full flex-col items-center justify-center px-3 text-center">
                <span className="text-7xl text-[#785682]">✿</span>

                <p
                  className={`${script.className} mt-4 text-3xl leading-tight text-[#684572] sm:text-4xl`}
                >
                  {benefit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   NOSOTROS
   ============================================================ */

export function AboutSection() {
  return (
    <section id="nosotros" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-[1100px] overflow-hidden rounded-2xl border border-[#e2d7e4] bg-white lg:grid-cols-2">
        <div className="flex min-h-[390px] items-center justify-center bg-[#f2eaf4]">
          <div className="text-center">
            <div className="mx-auto flex size-36 items-center justify-center rounded-full border border-[#d9c7df] bg-[#e8dceb]">
              <span className="text-6xl text-[#704b7d]">✿</span>
            </div>

            <p className={`${script.className} mt-5 text-5xl text-[#5d3a69]`}>
              Anabelle
            </p>
          </div>
        </div>

        <div className="flex items-center px-7 py-12 sm:px-12 lg:px-16">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
              Nosotros
            </p>

            <h2
              className={`${script.className} mt-3 text-[52px] leading-[.95] text-[#4c285f]`}
            >
              Hecho con
              <br />
              intención
            </h2>

            <p className="mt-6 text-sm leading-7 text-[#6a5e6e]">
              Cada producto de Floristería Anabelle busca transmitir una emoción. Cuidamos la
              selección, presentación y cada pequeño detalle para que regalar
              sea una experiencia.
            </p>

            <a
              href="#contacto"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-[#65358e]"
            >
              Escríbenos
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CONTACTO (WhatsApp y horario reales)
   ============================================================ */

export function ContactSection({
  whatsappHref,
  status,
}: {
  whatsappHref: string | null;
  status: BusinessStatus | null;
}) {
  const hours = todayHoursLabel(status);

  return (
    <section
      id="contacto"
      className="scroll-mt-20 border-t border-[#e8e0ea] bg-[#f6f0f8] px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-[700px] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
          Contacto
        </p>

        <h2
          className={`${script.className} mt-3 text-[55px] leading-none text-[#4c285f]`}
        >
          ¿Hablamos?
        </h2>

        <p className="mx-auto mt-4 max-w-[500px] text-sm leading-6 text-[#6a5e6e]">
          Escríbenos y te ayudamos a elegir el detalle ideal para esa persona
          especial.
        </p>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#65358e] px-6 text-sm font-black text-white transition hover:bg-[#572d7a]"
          >
            <MessageCircle size={17} />
            Escribir por WhatsApp
          </a>
        ) : null}

        <PublicStoreLocation />
        {hours ? (
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-[#6a5e6e]">
            <Clock size={14} aria-hidden="true" />
            Horario de hoy: {hours}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ============================================================
   PIE DE PÁGINA
   ============================================================ */

export function SiteFooter({
  categories,
  week,
  whatsappHref,
  year,
  onSelectCategory,
}: {
  categories: PublicCategory[];
  week: WeekDay[];
  whatsappHref: string | null;
  year: number;
  onSelectCategory: (id: string) => void;
}) {
  const days = orderedWeek(week);

  return (
    <footer className="bg-[#28202d] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className={`${script.className} text-[42px] leading-none`}>Anabelle</p>

          <p className="mt-1 text-[8px] font-black tracking-[0.32em] text-white/60">
            FLORISTERÍA
          </p>

          <p className="mt-5 max-w-[260px] text-xs leading-6 text-white/60">
            Flores, regalos y detalles para acompañar tus momentos especiales.
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-white/80">
            Catálogo
          </p>

          <div className="mt-4 flex flex-col items-start gap-3 text-xs text-white/60">
            <a href="#catalogo" className="hover:text-white">
              Todos los productos
            </a>

            {categories.slice(0, 4).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="text-left hover:text-white"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-white/80">
            Horario de atención
          </p>

          {days.length > 0 ? (
            <dl className="mt-4 flex flex-col gap-2 text-xs text-white/60">
              {days.map((day) => (
                <div key={day.day_of_week} className="flex justify-between gap-4">
                  <dt>{DAY_NAMES[day.day_of_week]}</dt>

                  <dd className="text-white/80">{dayHoursLabel(day)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-xs text-white/60">
              Consulta nuestro horario por WhatsApp.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-white/80">
            Contacto
          </p>

          <div className="mt-4 flex flex-col items-start gap-3 text-xs text-white/60">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            ) : (
              <span>Pronto compartiremos nuestro WhatsApp.</span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-6 text-center text-[11px] text-white/60">
        © {year} Floristería Anabelle. Todos los derechos reservados.
      </div>
    </footer>
  );
}
