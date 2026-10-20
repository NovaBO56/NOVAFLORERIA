import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";
import {CatalogSection} from "@/components/public/home/catalog";
import {CheckoutForm} from "@/components/public/checkout-form";
import type {PublicProduct} from "@/lib/public/types";

vi.mock("@/components/public/home/shared", () => ({script: {className: "script"}}));
// Markup tests of server-provided states, NOT a mocked proof of real inventory.
// Real 30/18/10-rose SQL/Auth/HTTP cases live in qa-shared-roses-local.mjs.
const products: PublicProduct[] = ["Ramo romántico", "Ramo pequeño", "Caja floral", "Arreglo especial"].map((name,index) => ({
  id: `test-${index}`, name, price: 100, images: [], category_id: null, occasion: null, season_id: null,
  is_featured: false, catalog_order: index, is_available: [false,true,true,false][index],
  is_sold_out: [true,false,false,true][index], available_quantity: [0,1,1,0][index],
}));
function catalog(items: PublicProduct[]) {
  return renderToStaticMarkup(createElement(CatalogSection, {categories: [], categoriesLoading: false, selectedCategory: null,
    searchTerm: "", favoritesOnly: false, favoriteIds: [], onSelectCategory: vi.fn(), onClearSearch: vi.fn(), onShowAll: vi.fn(),
    onRetry: vi.fn(), onLoadMore: vi.fn(), onToggleFavorite: vi.fn(), onAdd: vi.fn(), onOpenDetail: vi.fn(),
    state: {status: "ready", items, total: items.length, hasMore: false, loadingMore: false}}));
}
describe("Shared-rose availability presentation (unit/static markup)", () => {
  it("10 free roses: A and D show Agotado and cannot be added, B and C remain buyable", () => {
    const html=catalog(products), buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(match=>match[0]);
    expect(html.match(/>Agotado</g)).toHaveLength(2);
    for (const product of products) {
      const label=product.is_available ? `Agregar ${product.name} al carrito` : `${product.name} no está disponible`;
      const button=buttons.find(button=>button.includes(`aria-label="${label}"`));
      expect(button).toBeDefined(); expect(button?.includes("disabled=")).toBe(!product.is_available);
    }
  });
  it("a fresh restock response removes calculated sold-out labels without another manual switch", () => {
    const html=catalog(products.map(product=>({...product,is_available:true,is_sold_out:false})));
    expect(html).not.toContain(">Agotado<");
    expect([...html.matchAll(/<button\b[^>]*>/g)].filter(match=>match[0].includes("al carrito"))).toHaveLength(4);
    expect([...html.matchAll(/<button\b[^>]*>/g)].filter(match=>match[0].includes("al carrito")).every(match=>!match[0].includes("disabled="))).toBe(true);
  });
  it.each([true,false])("checkout reports unavailable=%s and prevents continuing when stock changed", unavailable => {
    const html=renderToStaticMarkup(createElement(CheckoutForm,{details:{customer_name:"TEST",customer_phone:"00063001",delivery:"retiro",address:"",notes:"",promotion_id:""},
      update:vi.fn(),items:[{id:"test",name:"TEST Ramo",price:100,quantity:1,image:null,available:!unavailable}],total:100,
      unavailable,busy:false,status:{is_open:true,opens_at:"08:00",closes_at:"20:00",is_closed_today:false,accept_orders_outside_hours:false,delivery_enabled:true},
      promotions:[],createOrder:vi.fn(async()=>{})}));
    const button=html.match(/<button\b[^>]*>Continuar a entrega/);
    expect(button).not.toBeNull(); expect(button?.[0].includes("disabled=")).toBe(unavailable);
    expect(html.includes("Algunos detalles ya no están disponibles en la cantidad elegida")).toBe(unavailable);
  });
});
