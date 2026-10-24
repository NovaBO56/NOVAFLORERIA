"use client";
import { BrandLogo, useStorefrontMedia } from "../storefront-media";
import { LocationCard } from "../location-card";
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
  todayHoursLabel,
} from "@/lib/public/format";
import type {
  BusinessStatus,
  PublicCategory,
  PublicImage,
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
    <div role="status" className="anabelle-hours-notice bg-[#392b38] px-5 py-2.5 text-center text-xs text-white">
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

export function HeroSection({ status }: { status: BusinessStatus | null }) {
  const hours = todayHoursLabel(status);
  return <section id="inicio" className="anabelle-floral-hero relative isolate overflow-hidden scroll-mt-28 bg-[#fff9f4]">
    <div className="mx-auto grid max-w-[1380px] items-center gap-2 px-6 py-10 sm:px-10 sm:py-12 lg:min-h-[520px] lg:grid-cols-[.45fr_.55fr] lg:gap-8 lg:px-14 lg:py-14">
      <div className="relative z-10 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#6b5965]">Floristería Anabelle</p>
        <h1 className={`${script.className} mt-5 text-[64px] leading-[.95] text-[#392b38] sm:text-[80px] lg:text-[88px]`}>Flores<br />que hablan</h1>
        <p className="mt-6 max-w-[470px] text-[15px] leading-7 text-[#6b5965] sm:text-base">Arreglos florales, regalos y detalles diseñados para acompañar los momentos que quieres recordar.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#catalogo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#873c58] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#713048] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]">Explorar catálogo<ArrowRight size={16} aria-hidden /></a>
          <a href="#catalogo" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cdb5d2] bg-white/80 px-5 py-3 text-sm font-bold text-[#392b38] hover:bg-[#f3e3e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]">Ver categorías</a>
        </div>
        {hours && <p className="mt-6 text-xs text-[#6b5965]">horario de hoy: <strong>{hours}</strong></p>}
      </div>
      <div className="flex min-w-0 items-center justify-center pt-4 lg:pt-0">
        <div className="relative aspect-[360/542] w-[200px] max-w-full sm:w-[240px] lg:w-[320px]">
          <Image src="/brand/banners/hero-tulips.png" alt="Ramo original de tulipanes blancos y rosas rojas con lazo rojo" fill priority sizes="(min-width: 1024px) 320px, (min-width: 640px) 240px, 200px" className="object-contain" />
        </div>
      </div>
    </div>
  </section>;
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
    <section className="border-b border-[#eadcdd] bg-white">
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
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f3e3e5] text-[#873c58]">
                <Icon size={19} strokeWidth={1.7} />
              </div>

              <div>
                <p className="text-sm font-black text-[#392b38]">
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
    <section id="nosotros" aria-labelledby="nosotros-title" className="anabelle-floral-essence scroll-mt-28 px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto grid max-w-[1280px] items-center gap-6 lg:grid-cols-[.95fr_1.05fr] lg:gap-12">
        <div className="order-2 flex min-w-0 items-end justify-center px-5 pt-2 lg:order-1 lg:self-stretch lg:px-7 lg:pt-8">
          <div className="relative aspect-[1122/1402] w-[250px] max-w-full sm:w-[300px] lg:w-[440px]">
            <Image src={configuredPhoto?.public_url || "/brand/banners/essence-bouquet-original.webp"} alt={configuredPhoto?.alt_text || "Ramo de rosas sostenido por una mano"} fill sizes="(min-width: 1024px) 440px, (min-width: 640px) 300px, 250px" className="object-contain" />
          </div>
        </div>

        <div className="order-1 flex min-w-0 items-center px-6 py-9 sm:px-10 sm:py-12 lg:order-2 lg:px-14">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b5965]">
              Nuestra esencia
            </p>

            <h2
              id="nosotros-title"
              className={`${script.className} mt-3 text-[52px] leading-[.95] text-[#392b38] sm:text-[60px]`}
            >
              Hecho con
              <br />
              intención
            </h2>

            <p className="mt-6 text-sm leading-7 text-[#6b5965]">
              Hay muchas formas de decir «te quiero», «gracias» o «estoy contigo».
              En Floristería Anabelle puedes elegir arreglos florales, regalos y
              detalles para acompañar esos momentos.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#6b5965]">Preparamos cada pedido con atención a su composición y presentación.
              Si tu detalle incluye tarjeta, añade una dedicatoria. Consulta las
              opciones de cada producto para darle tu toque personal.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#catalogo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#873c58] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#713048] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]">Explorar catálogo<ArrowRight size={16} aria-hidden /></a>
              <a href="#contacto" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9bfc6] px-4 py-3 text-sm font-bold text-[#873c58] transition-colors hover:bg-[#fbf2ef] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]">Contactar</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LocationSection({ location, hours, week, loading, unavailable }: { location: StoreLocation | null; hours: string | null; week: WeekDay[]; loading: boolean; unavailable: boolean }) {
  return <section id="ubicacion" aria-labelledby="ubicacion-title" className="scroll-mt-44 px-5 pb-16 pt-12 sm:px-8 sm:pb-20">
    <div className="mx-auto max-w-[1180px]">
      <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#6b5965]">Nuestro punto de encuentro</p>
      <h2 id="ubicacion-title" className={`mt-7 text-3xl font-semibold leading-tight tracking-tight text-[#392b38] sm:text-4xl`}>Ven a conocernos</h2>
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
      className="scroll-mt-44 border-t border-[#eadcdd] bg-[#f3e3e5] px-5 py-14 sm:px-8 sm:py-16"
    >
      <div className="mx-auto grid max-w-[1180px] items-center gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
        <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b5965]">
          Contacto
        </p>

        <h2
          id="contacto-title"
          className={`mt-3 text-3xl font-semibold tracking-tight leading-tight text-[#392b38] sm:text-4xl`}
        >
          ¿Hablamos?
        </h2>

        <p className="mt-4 max-w-[500px] text-sm leading-7 text-[#6b5965]">
          {whatsappHref ? "Cuéntanos qué tienes en mente. Te ayudamos a elegir y personalizar un detalle especial." : "Consulta tu pedido o encuentra la información para visitarnos."}
        </p>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#873c58] px-6 py-3 text-sm font-black text-white transition-colors hover:bg-[#713048] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]"
          >
            <MessageCircle size={17} aria-hidden />
            Escribir por WhatsApp
          </a>
        ) : <p className="mt-6 rounded-2xl border border-[#dfd2e5] bg-white/70 px-4 py-3 text-sm leading-6 text-[#66546f]">WhatsApp no está disponible por el momento. Puedes explorar el catálogo y consultar aquí el estado de tu pedido.</p>}
        <a href="/seguimiento" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#873c58] underline decoration-[#b9a6cf] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]">Consultar mi pedido<ArrowRight size={15} aria-hidden /></a>
        </div>
        <div className="min-w-0 rounded-[28px] border border-[#eadcdd] bg-white/80 p-6 sm:p-7">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f2eaf7] text-[#873c58]"><Clock size={18} aria-hidden /></span><div><h3 className="font-bold text-[#392b38]">Horario de hoy</h3><p className="mt-1 text-sm text-[#6b5965]">{hours || "Horario por confirmar"}</p></div></div>
          <a href="#ubicacion" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#873c58] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]"><MapPin size={17} aria-hidden />Ver ubicación y cómo llegar<ArrowRight size={15} aria-hidden /></a>
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
    <footer className="public-footer bg-[#392b38] px-5 py-9 text-white sm:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-6 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div className="min-w-0"><div className="inline-flex max-w-full items-center rounded-2xl bg-[#f3e3e5] px-3 py-2 [&_img]:mix-blend-darken"><BrandLogo className="h-14 max-w-[200px]"/></div><p className="mt-4 max-w-64 text-sm leading-6 text-white/85">Flores y detalles para acompañar tus momentos.</p></div>
        <details className="public-footer-group min-w-0"><summary className="min-h-11 cursor-pointer text-sm font-bold">Explorar el catálogo</summary><div className="public-footer-content mt-2 grid gap-1 text-sm text-white/85"><a className="inline-flex min-h-11 items-center" href="#catalogo">Todos los productos</a>{categories.slice(0,4).map(category => <button key={category.id} type="button" className="min-h-11 text-left [overflow-wrap:anywhere]" onClick={() => onSelectCategory(category.id)}>{category.name}</button>)}</div></details>
        <details className="public-footer-group min-w-0"><summary className="min-h-11 cursor-pointer text-sm font-bold">Horarios de atención</summary>{days.length ? <dl className="public-footer-content mt-2 grid gap-3 text-sm text-white/85">{days.map(day => <div key={day.day_of_week} className="flex flex-wrap justify-between gap-2"><dt>{DAY_NAMES[day.day_of_week]}</dt><dd>{dayHoursLabel(day)}</dd></div>)}</dl> : <p className="mt-2 text-sm text-white/85">{whatsappHref ? "Consulta nuestro horario por WhatsApp." : "Horario por configurar."}</p>}</details>
        <div className="min-w-0"><h3 className="flex min-h-11 items-center text-sm font-bold">Tu visita y tu pedido</h3><div className="grid gap-1 text-sm text-white/85">{whatsappHref && <a className="inline-flex min-h-11 items-center" href={whatsappHref} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>}<a className="inline-flex min-h-11 items-center gap-2" href="#ubicacion"><MapPin size={16} aria-hidden/>Ubicación y cómo llegar</a><a className="inline-flex min-h-11 items-center" href="/seguimiento">Consultar mi pedido</a>{location?.address && <address className="mt-1 not-italic text-sm leading-6 [overflow-wrap:anywhere]">{location.address}</address>}</div></div>
      </div>
      <div className="mx-auto mt-7 max-w-[1280px] border-t border-white/20 pt-5 text-xs leading-5 text-white/80">© {year} Floristería Anabelle. Todos los derechos reservados.</div>
    </footer>
  );
}
