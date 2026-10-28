import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
beforeEach(() => vi.stubGlobal("React", React));

describe("Bounded product images and accessible fallback", () => {
  it("identifies missing imagery without using an invented photograph or giant text fallback", () => {
    const html = renderToStaticMarkup(<ProductThumbnail alt="Ramo" size="sm"/>);
    expect(html).toContain('aria-label="Ramo: imagen no disponible"');
    expect(html).not.toContain("<img"); expect(html).not.toContain("min-h-24"); expect(html).not.toContain("<button");
  });
  it("uses a fixed square, lazy image and correct alt text for a catalogue asset", () => {
    const html = renderToStaticMarkup(<ProductThumbnail src="/product.webp" alt="Ramo comprado"/>);
    expect(html).toContain('alt="Ramo comprado"'); expect(html).toContain('loading="lazy"');
    expect(html).toContain('sizes="56px"'); expect(html).toContain("size-14");
  });
  it("offers enlargement only when an image is present, without mounting a hidden dialog", () => {
    const html = renderToStaticMarkup(<ProductThumbnail src="/product.webp" alt="Ramo" preview/>);
    expect(html).toContain('aria-label="Ampliar imagen de Ramo"');
    expect(html).toContain('aria-haspopup="dialog"'); expect(html).not.toContain('role="dialog"');
    expect(renderToStaticMarkup(<ProductThumbnail alt="Ramo" preview/>)).not.toContain("<button");
  });
});
