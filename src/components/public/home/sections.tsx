"use client";
import { BrandLogo, useStorefrontMedia } from "../storefront-media";
import { LocationCard } from "../location-card";
import { WeeklyHours } from "../weekly-hours";
import type { StoreLocation } from "@/validations/store-location";


import { SafeImage as Image } from "@/components/public/safe-image";
import {
  ArrowRight,
  Clock,
  Heart,
  MessageCircle,
  MapPin,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  DAY_NAMES,
  dayHoursLabel,
  orderedWeek,
  pickImage,
  todayHoursLabel,
} from "@/lib/public/format";
import type {
  BusinessStatus,
  PublicCategory,
  PublicImage,
  PublicProduct,
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
    <div role="status" className="anabelle-hours-notice bg-[#4c285f] px-5 py-2.5 text-center text-xs text-white">
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
  status,
  heroProduct,
  hasPromotions,
}: {
  status: BusinessStatus | null;
  heroProduct: PublicProduct | null;
  hasPromotions: boolean;
}) {
  const heroImage = heroProduct ? pickImage(heroProduct) : null;
  const hours = todayHoursLabel(status);

  return (
    <section id="inicio" className="nova-hero relative isolate overflow-hidden scroll-mt-20 border-b border-[#e8e0ea] bg-[#f6f0f8]">
      <div className="nova-hero-petals pointer-events-none absolute inset-0 -z-10" aria-hidden="true"/><div className="mx-auto grid max-w-[1280px] lg:grid-cols-[1fr_1fr]">
        <div className="flex items-center px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-24">
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
                  {hours ?? "—"}
                </p>

                <p className="mt-1 text-xs text-[#736877]">horario de hoy</p>
              </div>
            </div>
          </div>
        </div>

        {/* IMAGEN PRINCIPAL: foto de un producto destacado si existe */}
        <div className="relative min-h-[320px] bg-[#e7dce9] sm:min-h-[420px] lg:min-h-[620px]">
          <div className="absolute inset-6 border border-white/70 sm:inset-10" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[56%] max-w-[280px] sm:w-[64%] sm:max-w-[300px] lg:w-[72%] lg:max-w-[420px]">
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

export { PromotionSection } from "./promotion-section";

/* ============================================================
   NOSOTROS
   ============================================================ */

export function AboutSection({ photo = null }: { photo?: PublicImage | null }) {
  const media = useStorefrontMedia();
  const configuredPhoto = media.about ? { id: "configured-about", public_url: media.about, alt_text: "Fotografía configurada de Floristería Anabelle", sort_order: 0 } : photo;
  return (
    <section id="nosotros" aria-labelledby="nosotros-title" className="scroll-mt-44 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-[32px] border border-[#e2d7e4] bg-white shadow-[0_18px_50px_-36px_rgba(76,40,95,.25)] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative order-2 flex min-h-[180px] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#f6e3ee,#eee7f5)] p-6 sm:min-h-[240px] lg:order-1 lg:min-h-[440px]">
          {configuredPhoto?.public_url ? <Image src={configuredPhoto.public_url} alt={configuredPhoto.alt_text || "Fotografía de Floristería Anabelle"} fill sizes="(min-width: 1024px) 530px, 100vw" className="object-cover" /> : <div className="flex items-center gap-5 text-center lg:flex-col lg:gap-0">
            <div aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-full border border-[#d9c7df] bg-white/50 lg:size-36"><span className="text-5xl text-[#704b7d] lg:text-6xl">✿</span></div>
            <div><p className={`${script.className} text-4xl text-[#5d3a69] lg:mt-5 lg:text-5xl`}>Anabelle</p><p className="mt-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#715e7b]">Ilustración floral</p></div>
          </div>}
        </div>

        <div className="order-1 flex min-w-0 items-center px-6 py-9 sm:px-10 sm:py-12 lg:order-2 lg:px-14">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
              Nosotros
            </p>

            <h2
              id="nosotros-title"
              className={`${script.className} mt-3 text-[52px] leading-[.95] text-[#4c285f] sm:text-[60px]`}
            >
              Hecho con
              <br />
              intención
            </h2>

            <p className="mt-6 text-sm leading-7 text-[#6a5e6e]">
              Hay muchas formas de decir «te quiero», «gracias» o «estoy contigo».
              En Floristería Anabelle puedes elegir arreglos florales, regalos y
              detalles para acompañar esos momentos.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#6a5e6e]">Preparamos cada pedido con atención a su composición y presentación.
              Si tu detalle incluye tarjeta, añade una dedicatoria. Consulta las
              opciones de cada producto para darle tu toque personal.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#catalogo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#65358e] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#572d7a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]">Explorar catálogo<ArrowRight size={16} aria-hidden /></a>
              <a href="#contacto" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8c8de] px-4 py-3 text-sm font-bold text-[#65358e] transition-colors hover:bg-[#f5eff7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]">Contactar</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LocationSection({ location, hours, week, loading, unavailable }: { location: StoreLocation | null; hours: string | null; week: WeekDay[]; loading: boolean; unavailable: boolean }) {
  return <section id="ubicacion" aria-labelledby="ubicacion-title" className="scroll-mt-44 px-5 pb-16 sm:px-8 sm:pb-20">
    <div className="mx-auto max-w-[1180px]">
      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#796481]">Nuestro punto de encuentro</p>
      <h2 id="ubicacion-title" className={`${script.className} mt-3 text-[50px] leading-none text-[#4c285f] sm:text-[60px]`}>Ven a conocernos</h2>
      <LocationCard location={location} hours={hours} week={week} loading={loading} unavailable={unavailable} />
    </div>
  </section>;
}

/* ============================================================
   CONTACTO (WhatsApp y horario reales)
   ============================================================ */

export function ContactSection({
  whatsappHref,
  status,
  week = [],
}: {
  whatsappHref: string | null;
  status: BusinessStatus | null;
  week?: WeekDay[];
}) {
  const hours = todayHoursLabel(status);

  return (
    <section
      id="contacto"
      aria-labelledby="contacto-title"
      className="scroll-mt-44 border-t border-[#e8e0ea] bg-[#f6f0f8] px-5 py-14 sm:px-8 sm:py-16"
    >
      <div className="mx-auto grid max-w-[1180px] items-center gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
        <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#796481]">
          Contacto
        </p>

        <h2
          id="contacto-title"
          className={`${script.className} mt-3 text-[55px] leading-none text-[#4c285f]`}
        >
          ¿Hablamos?
        </h2>

        <p className="mt-4 max-w-[500px] text-sm leading-7 text-[#6a5e6e]">
          Escríbenos y te ayudamos a elegir el detalle ideal para esa persona
          especial.
        </p>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#65358e] px-6 py-3 text-sm font-black text-white transition-colors hover:bg-[#572d7a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]"
          >
            <MessageCircle size={17} aria-hidden />
            Escribir por WhatsApp
          </a>
        ) : <p className="mt-6 rounded-2xl border border-[#dfd2e5] bg-white/70 px-4 py-3 text-sm leading-6 text-[#66546f]">WhatsApp no está disponible por el momento. Puedes explorar el catálogo y consultar aquí el estado de tu pedido.</p>}
        <a href="/seguimiento" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#65358e] underline decoration-[#b9a6cf] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]">Consultar mi pedido<ArrowRight size={15} aria-hidden /></a>
        </div>
        <div className="min-w-0 rounded-[28px] border border-[#e4d8e8] bg-white/80 p-6 sm:p-7">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f2eaf7] text-[#79578c]"><Clock size={18} aria-hidden /></span><div><h3 className="font-bold text-[#4c285f]">Horario de hoy</h3><p className="mt-1 text-sm text-[#6a5e6e]">{hours || "Horario por confirmar"}</p></div></div>
          <WeeklyHours week={week} />
          <a href="#ubicacion" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#65358e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]"><MapPin size={17} aria-hidden />Ver ubicación y cómo llegar<ArrowRight size={15} aria-hidden /></a>
        </div>
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
  location = null,
  onSelectCategory,
}: {
  categories: PublicCategory[];
  week: WeekDay[];
  whatsappHref: string | null;
  year: number;
  location?: StoreLocation | null;
  onSelectCategory: (id: string) => void;
}) {
  const days = orderedWeek(week);

  return (
    <footer className="bg-[#28202d] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 [&>div]:min-w-0">
        <div>
          <div className="inline-flex max-w-full items-center rounded-2xl bg-[#f3dee6] px-4 py-3 [&_img]:mix-blend-darken"><BrandLogo className="h-16 max-w-[220px]"/></div>

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
              {whatsappHref ? "Consulta nuestro horario por WhatsApp." : "Horario por configurar."}
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
            <a href="#ubicacion" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><MapPin size={15} aria-hidden />Ubicación</a>
            {location?.address && <address className="line-clamp-2 max-w-full not-italic leading-6 text-white/75 [overflow-wrap:anywhere]">{location.address}</address>}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-6 text-center text-[11px] text-white/60">
        © {year} Floristería Anabelle. Todos los derechos reservados.
      </div>
    </footer>
  );
}
