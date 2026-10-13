import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { locationMapLinks } from "@/lib/public/location-map";
import { LocationCard } from "@/components/public/location-card";
import { storeLocationSchema } from "@/validations/store-location";

describe("Configured location only", () => {
  it("empty location creates neither map nor destination", () => expect(locationMapLinks({})).toEqual({directions:null,preview:null}));
  it("preserves coordinates zero rather than inventing a fallback", () => {
    const result=locationMapLinks({latitude:0,longitude:0});
    expect(new URL(result.preview!).searchParams.get("q")).toBe("0,0");expect(result.directions).toContain("destination=0,0");
  });
  it("uses exactly the configured address when no coordinates/link exist", () => {
    const result=locationMapLinks({address:"TEST ADDRESS & local"});
    expect(new URL(result.preview!).searchParams.get("q")).toBe("TEST ADDRESS & local");
    expect(new URL(result.directions!).searchParams.get("destination")).toBe("TEST ADDRESS & local");
  });
  it("a short Maps link stays a destination and is never used as an iframe", () => expect(locationMapLinks({maps_url:"https://maps.app.goo.gl/TEST"})).toEqual({directions:"https://maps.app.goo.gl/TEST",preview:null}));
  it("uses a configured public embed without forwarding unrelated query secrets", () => {
    const result=locationMapLinks({maps_url:"https://www.google.com/maps/embed?pb=TEST&key=DO_NOT_FORWARD"});
    expect(result.preview).toBe("https://www.google.com/maps/embed?pb=TEST");
  });
  it.each([{latitude:91,longitude:0},{latitude:0},{maps_url:"javascript:alert(1)"},{maps_url:"https://example.invalid"}])("invalid config %j cannot load any map", value=>expect(locationMapLinks(value)).toEqual({directions:null,preview:null}));
});
describe("Location card markup; visual layout tested separately", () => {
  it("empty configuration remains elegant without fictitious address or map", () => {
    const html=renderToStaticMarkup(createElement(LocationCard,{location:null,hours:null}));
    expect(html).toContain("Ubicación por configurar");expect(html).not.toContain("<iframe");expect(html).not.toContain("Cómo llegar");
  });
  it("configured preview is lazy, accessible, borderless and bounded", () => {
    const location=storeLocationSchema.parse({latitude:0,longitude:0,address:"TEST ADDRESS",reference:"TEST REFERENCE"});
    const html=renderToStaticMarkup(createElement(LocationCard,{location,hours:"08:00 – 20:00"}));
    expect(html).toContain('loading="lazy"');expect(html).toContain('title="Mapa de la ubicación configurada');expect(html).toContain('border-0');expect(html).toContain('overflow-hidden');expect(html).toContain("TEST REFERENCE");expect(html).toContain("08:00 – 20:00");expect(html).toContain("Cómo llegar");
  });
  it("unavailable configuration is distinct from not yet configured", () => expect(renderToStaticMarkup(createElement(LocationCard,{location:null,hours:null,unavailable:true}))).toContain("No pudimos consultar la ubicación"));
});
