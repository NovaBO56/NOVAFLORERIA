import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatCard } from "@/components/ui/stat-card";

afterEach(() => vi.unstubAllGlobals());
describe("StatCard: importes completos (render SSR, no medición de viewport)", () => {
  it.each(["Bs 4.447,00", "Bs 123.456.789,99", "999999999999999999999999999999"])("conserva %s con y sin icono", value => {
    vi.stubGlobal("React", React);
    for (const icon of [undefined, React.createElement("svg")]) {
      const html = renderToStaticMarkup(React.createElement(StatCard, { label: "Total vendido", value, icon }));
      expect(html).toContain(value);
      expect(html).not.toMatch(/truncate|text-ellipsis|line-clamp|overflow-hidden/);
      expect(html).toContain("[overflow-wrap:anywhere]");
      expect(html).toContain("grid-cols-[minmax(0,1fr)_auto]");
      expect(html).toContain("col-span-2 min-w-0");
    }
  });
});
