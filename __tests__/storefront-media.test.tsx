import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { publicStorefrontMedia, emptyStorefrontMedia } from "@/lib/public/storefront-media";
import { BrandLogo, FloralMark } from "@/components/public/storefront-media";
const id = "550e8400-e29b-41d4-a716-446655440000";
describe("Storefront image contract (unit; not uploaded-photo visual evidence)", () => {
  it("keeps the absent configuration empty instead of inventing photographs", () => {
    expect(publicStorefrontMedia(null, "http://127.0.0.1:62621")).toEqual(emptyStorefrontMedia);
  });
  it("derives image URLs from the current environment and existing Storage bucket", () => {
    const media = publicStorefrontMedia({ logo: `storefront/logo/${id}.webp`, about: null, categories: { [id]: `storefront/category/${id}.webp` } }, "http://127.0.0.1:62621/");
    expect(media.logo).toBe(`http://127.0.0.1:62621/storage/v1/object/public/product-images/storefront/logo/${id}.webp`);
    expect(media.categories[id]).toContain("/storefront/category/"); expect(media.about).toBeNull();
  });
  it.each(["https://untrusted.example/photo.png", "../private/secret", "storefront/logo/../../private.webp", "javascript:alert(1)"])("rejects unsafe stored path %s", logo => {
    expect(publicStorefrontMedia({ logo, about: null, categories: {} }, "http://127.0.0.1:62621")).toEqual(emptyStorefrontMedia);
  });
  it("does not serialize arbitrary settings or secrets into the public response", () => {
    const media = publicStorefrontMedia({ logo: null, about: null, categories: {}, private_setting: "never-return" }, "http://127.0.0.1:62621");
    expect(JSON.stringify(media)).not.toContain("never-return");
  });
  it("uses the owner's supplied monogram when no uploaded override exists", () => {
    vi.stubGlobal("React", React);
    expect(renderToStaticMarkup(<FloralMark/>)).toContain("anabelle-monogram.webp");
    vi.unstubAllGlobals();
  });
  it("keeps the official horizontal proportions and accessible brand text", () => {
    vi.stubGlobal("React",React);
    const html=renderToStaticMarkup(<BrandLogo/>);
    expect(html).toContain("anabelle-horizontal.webp");expect(html).toContain('width="591"');expect(html).toContain('height="202"');expect(html).toContain('alt="Floristería Anabelle"');
    vi.unstubAllGlobals();
  });
});
