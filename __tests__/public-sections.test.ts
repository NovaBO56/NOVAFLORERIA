import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BusinessStatus, PublicImage, WeekDay } from "@/lib/public/types";
import { storeLocationSchema } from "@/validations/store-location";

vi.mock("@/components/public/home/shared", () => ({ script: { className: "script-font" } }));
vi.mock("@/components/public/safe-image", () => ({
  SafeImage: ({ src, alt, className }: { src: string; alt: string; className?: string }) => createElement("img", { src, alt, className }),
}));

import {
  AboutSection,
  ContactSection,
  LocationSection,
  SiteFooter,
} from "@/components/public/home/sections";

const status: BusinessStatus = {
  is_open: true,
  opens_at: "08:00:00",
  closes_at: "20:00:00",
  is_closed_today: false,
  accept_orders_outside_hours: false,
};
// Deliberately unordered: consumers should display the configured week Monday first.
const week: WeekDay[] = [0, 4, 2, 6, 1, 5, 3].map((day) => ({
  day_of_week: day,
  opens_at: day === 0 ? "09:00:00" : "08:00:00",
  closes_at: day === 0 ? "14:00:00" : "20:00:00",
  is_closed: false,
}));
const location = storeLocationSchema.parse({
  branch_name: "LOCAL TEST",
  address: "Dirección configurada de prueba & referencia",
  reference: "Entrada configurada de prueba",
  latitude: 0,
  longitude: 0,
});
const whatsappHref = "https://wa.me/59100000000?text=CONSULTA%20TEST";
const footerProps = {
  categories: [],
  week,
  whatsappHref: null,
  year: 2026,
  onSelectCategory: () => {},
};
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("Public brand, contact and location sections", () => {
  it("keeps the brand heading and actions with the owner's supplied bouquet", () => {
    const html = renderToStaticMarkup(createElement(AboutSection));
    expect(text(html)).toContain("Hecho con intención");
    expect(html).toContain('href="#catalogo"');
    expect(html).toContain('href="#contacto"');
    expect(html).toContain('src="/brand/banners/essence-bouquet-original.webp"');
    expect(html).toContain("object-contain");
    expect(html).not.toContain("<iframe");
  });

  it("renders only the explicitly supplied authentic shop image", () => {
    const photo: PublicImage = {
      id: "configured-shop-photo",
      public_url: "/test/configured-shop.webp",
      alt_text: "Fotografía configurada del local TEST",
      sort_order: 0,
    };
    const html = renderToStaticMarkup(createElement(AboutSection, { photo }));
    expect(html).toContain('src="/test/configured-shop.webp"');
    expect(html).toContain('alt="Fotografía configurada del local TEST"');
  });

  it("preserves the configured WhatsApp destination and separates contact from the location map", () => {
    const html = renderToStaticMarkup(createElement(ContactSection, { whatsappHref, status, week }));
    expect(html).toContain(`href="${whatsappHref}"`);
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<address");
    expect(html).not.toContain('id="ubicacion"');
  });

  it("does not invent an external contact when WhatsApp and hours are absent", () => {
    const html = renderToStaticMarkup(createElement(ContactSection, { whatsappHref: null, status: null, week: [] }));
    expect(html).not.toContain("wa.me");
    expect(html).not.toContain("08:00");
    expect(html).not.toContain("<iframe");
  });

  it("keeps today in contact and the full configured week in location and footer", () => {
    const html = renderToStaticMarkup(createElement(ContactSection, { whatsappHref: null, status, week }));
    const content = text(html);
    expect(content).toContain("08:00 – 20:00");
    expect(content).not.toContain("Domingo");
    const fullWeek = text(renderToStaticMarkup(createElement(SiteFooter, footerProps)));
    expect(fullWeek).toContain("09:00 – 14:00");
    expect(fullWeek.indexOf("Lunes")).toBeGreaterThan(-1);
    expect(fullWeek.indexOf("Domingo")).toBeGreaterThan(fullWeek.indexOf("Lunes"));
  });

  it("keeps a single location anchor and no fabricated destination in the unconfigured state", () => {
    const html = renderToStaticMarkup(createElement(LocationSection, { location: null, hours: null, week: [], loading: false, unavailable: false }));
    expect(html.match(/id="ubicacion"/g)).toHaveLength(1);
    expect(html).toContain("Ubicación por configurar");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("maps/dir");
  });

  it("automatically embeds the configured location while preserving its address and external destination", () => {
    const html = renderToStaticMarkup(createElement(LocationSection, { location, hours: "08:00 – 20:00", week, loading: false, unavailable: false }));
    expect(html.match(/id="ubicacion"/g)).toHaveLength(1);
    expect(html).toContain("<iframe");
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain("Mostrar mapa");
    expect(html).toContain("Abrir en Google Maps");
    expect(html).toContain("Entrada configurada de prueba");
    expect(html).toContain("Dirección configurada de prueba &amp; referencia");
    expect(html).toContain("destination=0,0");
    expect(html).toContain("overflow-hidden");
  });

  it("keeps an API availability failure distinct from missing location configuration", () => {
    const html = renderToStaticMarkup(createElement(LocationSection, { location: null, hours: null, week: [], loading: false, unavailable: true }));
    expect(html).toContain("No pudimos consultar la ubicación");
    expect(html).not.toContain("<iframe");
  });

  it("exposes a location loading status without introducing an unconfigured map", () => {
    const html = renderToStaticMarkup(createElement(LocationSection, { location: null, hours: null, week: [], loading: true, unavailable: false }));
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("<iframe");
  });

  it("adds the location footer link and configured address without a duplicate embedded map", () => {
    const html = renderToStaticMarkup(createElement(SiteFooter, { ...footerProps, location }));
    expect(html).toContain('href="#ubicacion"');
    expect(html).toContain('href="#catalogo"');
    expect(html).toContain("Dirección configurada de prueba &amp; referencia");
    expect(html).not.toContain("<iframe");
  });

  it("does not fabricate a footer address or map when configuration is missing", () => {
    const html = renderToStaticMarkup(createElement(SiteFooter, { ...footerProps, location: null }));
    expect(html).toContain('href="#ubicacion"');
    expect(html).not.toContain("<address");
    expect(html).not.toContain("maps.google");
    expect(html).not.toContain("Dirección configurada de prueba");
  });
});
