import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OrderStatusDonut, SalesChart } from "@/components/admin/dashboard-charts";

describe("Dashboard presentation, not browser/layout evidence", () => {
  it("donut total and percentages come from existing states, including cancelled/rejected", () => {
    const html=renderToStaticMarkup(createElement(OrderStatusDonut,{statuses:{confirmado:2,cancelado:1,rechazado:1}}));
    expect(html).toContain("Total pedidos");expect(html).toContain("(50%)");expect(html.match(/\(25%\)/g)).toHaveLength(2);
    expect(html).toContain("estado=cancelado");expect(html).toContain("estado=rechazado");expect(html).not.toContain("NaN");
  });
  it("empty donut has no invented counts or percentages", () => {
    const html=renderToStaticMarkup(createElement(OrderStatusDonut,{statuses:{}}));
    expect(html).toContain("Todavía no hay pedidos");expect(html).not.toContain("NaN");expect(html).not.toContain("conic-gradient");
  });
  it("chart retains exact negative net values and accessible amounts, without recomputing money", () => {
    const html=renderToStaticMarkup(createElement(SalesChart,{series:[{date:"2026-10-13",gross_sales:0,refunds:90,net_sales:-90}]}));
    expect(html).toContain("-90,00");expect(html).toContain("devoluciones Bs 90,00");expect(html).toContain("Ver importes por día");expect(html).toContain('tabindex="0"');
  });
  it("zero-sales period has an explicit empty message", () => {
    const html=renderToStaticMarkup(createElement(SalesChart,{series:[{date:"2026-10-13",gross_sales:0,refunds:0,net_sales:0}]}));
    expect(html).toContain("Sin ventas ni reintegros");expect(html).not.toContain("NaN");
  });
  it("large amounts remain complete in the tooltip and table", () => {
    const html=renderToStaticMarkup(createElement(SalesChart,{series:[{date:"2026-10-13",gross_sales:9999999999.99,refunds:0,net_sales:9999999999.99}]}));
    expect(html).toContain("9.999.999.999,99");
  });
});
