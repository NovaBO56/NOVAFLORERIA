"use client";
import type { Dedication } from "@/lib/public/dedications";

import { useEffect, useRef, useState } from "react";
import { selectPromotion, usePromotionSelection } from "@/lib/public/promotion-selection";
import { canBuildCombo } from "@/lib/public/promotion-shopping";
import {
  acceptingOrders,
  todayHoursLabel,
  whatsappLink,
} from "@/lib/public/format";
import { createLocalStore } from "@/lib/public/local-store";
import { MobileNavigation } from "../mobile-navigation";
import { storeLocationSchema, type StoreLocation } from "@/validations/store-location";
import type {
  BusinessStatus,
  CustomizationOption,
  PublicCategory,
  PublicProduct,
  PublicPromotion,
  WeekDay,
} from "@/lib/public/types";
import { addToCart, addComboToCart, CartDrawer, useCart } from "./cart";
import { CatalogSection, type CatalogState } from "./catalog";
import { SiteHeader, type NavItem } from "./header";
import { ProductDetailSection } from "./product-detail";
import {
  AboutSection,
  ClosedBanner,
  ContactSection,
  HeroSection,
  LocationSection,
  PromotionSection,
  ServiceStrip,
  SiteFooter,
} from "./sections";
import { lato, scrollToId } from "./shared";
import { ShoppingNotice } from "../shopping-notice";

const PAGE_SIZE = 8;
const MAX_FAVORITES = 100;
const NO_FAVORITES: string[] = [];

/* ============================================================
   FAVORITOS (guardados en el navegador del cliente)
   ============================================================ */

const favoritesStore = createLocalStore<string[]>({
  key: "nova-favorites-v1",
  initial: NO_FAVORITES,
  sanitize: (raw) =>
    Array.isArray(raw)
      ? raw
          .filter((id): id is string => typeof id === "string")
          .slice(0, MAX_FAVORITES)
      : NO_FAVORITES,
});

function toggleFavorite(id: string) {
  favoritesStore.update((list) =>
    list.includes(id)
      ? list.filter((entry) => entry !== id)
      : [...list, id].slice(-MAX_FAVORITES),
  );
}

/* ============================================================
   ACCESO AL API PÚBLICO
   ============================================================ */

type ProductsResponse = {
  products: PublicProduct[];
  pagination?: { page: number; total: number; total_pages: number };
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as T & {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? "No se pudo completar la solicitud.");
  }

  return data;
}

function settled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

type Meta = {
  loaded: boolean;
  categories: PublicCategory[];
  status: BusinessStatus | null;
  week: WeekDay[];
  whatsapp: string | null;
  promotions: PublicPromotion[];
  heroProduct: PublicProduct | null;
  totalProducts: number | null;
  location: StoreLocation | null;
  locationUnavailable: boolean;
};

const initialMeta: Meta = {
  loaded: false,
  categories: [],
  status: null,
  week: [],
  whatsapp: null,
  promotions: [],
  heroProduct: null,
  totalProducts: null,
  location: null,
  locationUnavailable: false,
};

type CatalogData = {
  key: string;
  items: PublicProduct[];
  page: number;
  totalPages: number;
  total: number;
  error: boolean;
  loadingMore: boolean;
};

const initialCatalog: CatalogData = {
  key: "",
  items: [],
  page: 1,
  totalPages: 1,
  total: 0,
  error: false,
  loadingMore: false,
};

function productsUrl(page: number, category: string | null, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (category) params.set("category_id", category);
  if (search) params.set("search", search);

  return `/api/products?${params.toString()}`;
}

function mergeUnique(current: PublicProduct[], extra: PublicProduct[]) {
  const seen = new Set(current.map((product) => product.id));

  return [...current, ...extra.filter((product) => !seen.has(product.id))];
}

/* ============================================================
   PÁGINA PRINCIPAL
   ============================================================ */

export default function HomePage({ year }: { year: number }) {
  const cart = useCart();
  const selectedPromotionId = usePromotionSelection();
  const favoriteIds = favoritesStore.useValue();

  const [cartOpen, setCartOpen] = useState(false);
  const [meta, setMeta] = useState<Meta>(initialMeta);

  // Filtros del catálogo
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [catalogData, setCatalogData] = useState<CatalogData>(initialCatalog);
  const [favoritesData, setFavoritesData] = useState<{
    key: string;
    items: PublicProduct[];
  }>({ key: "", items: [] });

  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const [combo, setCombo] = useState<{ promotion: PublicPromotion; index: number; choices: { product: PublicProduct; quantity: number; options: CustomizationOption[]; message: string; dedications?: Dedication[]; cardQuantity?: number }[] } | null>(null);
  const [shoppingError, setShoppingError] = useState("");
  const [shoppingNotice, setShoppingNotice] = useState("");
  const [offerReturn, setOfferReturn] = useState(0);
  const visibleIds = JSON.stringify([...new Set([...catalogData.items, ...favoritesData.items].map(product => product.id))]);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NOVA_VISUAL_PREVIEW === "true") return;
    let cancelled = false, running = false;
    const refresh = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const ids: string[] = JSON.parse(visibleIds);
        const states = new Map<string, Pick<PublicProduct, "is_available" | "is_sold_out" | "available_quantity">>();
        for (let start = 0; start < ids.length; start += 50) {
          const response = await fetch("/api/products/availability", { method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ items: ids.slice(start, start + 50).map(product_id => ({ product_id, quantity: 1 })), combine: false }) });
          if (!response.ok) return;
          const data = await response.json();
          for (const row of data.availability ?? []) states.set(row.product_id, { is_available: row.is_available, is_sold_out: row.is_sold_out, available_quantity: row.available_quantity });
        }
        const [promotions, featured] = await Promise.all([
          getJson<{ promotions: PublicPromotion[] }>("/api/promotions"),
          getJson<ProductsResponse>("/api/products?limit=1&is_featured=true"),
        ]);
        if (cancelled) return;
        const update = (products: PublicProduct[]) => products.map(product => ({ ...product, ...states.get(product.id) }));
        setCatalogData(current => ({ ...current, items: update(current.items) }));
        setFavoritesData(current => ({ ...current, items: update(current.items) }));
        setMeta(current => ({ ...current, promotions: promotions.promotions, heroProduct: featured.products[0] ?? null }));
      } catch { /* Preserve the last successful read; order creation still checks atomically. */ }
      finally { running = false; }
    };
    const timer = setInterval(() => void refresh(), 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [visibleIds]);
  const comboFlight = useRef(false);
  useEffect(() => { comboFlight.current = false; }, [combo?.index, combo?.promotion.id]);

  /* ---------- datos generales (una sola vez) ---------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [categories, hours, whatsapp, promotions, featured, all, location] =
        await Promise.allSettled([
          getJson<{ categories: PublicCategory[] }>("/api/categories"),
          getJson<{ status: BusinessStatus | null; week: WeekDay[] }>(
            "/api/business-hours",
          ),
          getJson<{ whatsapp: { phone_number: string } }>(
            "/api/whatsapp-config",
          ),
          getJson<{ promotions: PublicPromotion[] }>("/api/promotions"),
          getJson<ProductsResponse>("/api/products?limit=1&is_featured=true"),
          getJson<ProductsResponse>("/api/products?limit=1"),
          getJson<{ location: unknown }>("/api/store-location"),
        ]);

      if (cancelled) return;

      const allResult = settled(all);
      const configuredLocation = storeLocationSchema.safeParse(settled(location)?.location);

      setMeta({
        loaded: true,
        categories: settled(categories)?.categories ?? [],
        status: settled(hours)?.status ?? null,
        week: settled(hours)?.week ?? [],
        whatsapp: settled(whatsapp)?.whatsapp?.phone_number ?? null,
        promotions: settled(promotions)?.promotions ?? [],
        heroProduct: settled(featured)?.products?.[0] ?? null,
        totalProducts: allResult
          ? (allResult.pagination?.total ?? allResult.products.length)
          : null,
        location: configuredLocation.success ? configuredLocation.data : null,
        locationUnavailable: location.status === "rejected" || !configuredLocation.success,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- catálogo (se recarga al cambiar filtros) ---------- */

  const filterKey = `${category ?? ""}|${search}|${reloadToken}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getJson<ProductsResponse>(
          productsUrl(1, category, search),
        );

        if (cancelled) return;

        setCatalogData({
          key: filterKey,
          items: data.products ?? [],
          page: 1,
          totalPages: data.pagination?.total_pages ?? 1,
          total: data.pagination?.total ?? data.products?.length ?? 0,
          error: false,
          loadingMore: false,
        });
      } catch (error) {
        console.error("Error cargando el catálogo:", error);

        if (!cancelled) {
          setCatalogData({ ...initialCatalog, key: filterKey, error: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, search, filterKey]);

  async function loadMore() {
    if (catalogData.loadingMore || catalogData.page >= catalogData.totalPages) {
      return;
    }

    const startedWith = catalogData.key;
    const nextPage = catalogData.page + 1;

    setCatalogData((current) => ({ ...current, loadingMore: true }));

    try {
      const data = await getJson<ProductsResponse>(
        productsUrl(nextPage, category, search),
      );

      setCatalogData((current) =>
        current.key !== startedWith
          ? current // los filtros cambiaron mientras tanto
          : {
              ...current,
              items: mergeUnique(current.items, data.products ?? []),
              page: nextPage,
              totalPages: data.pagination?.total_pages ?? current.totalPages,
              total: data.pagination?.total ?? current.total,
              loadingMore: false,
            },
      );
    } catch (error) {
      console.error("Error cargando más productos:", error);
      setCatalogData((current) => ({ ...current, loadingMore: false }));
    }
  }

  /* ---------- favoritos: se piden por id (pueden estar en cualquier página) ---------- */

  const favoritesKey = favoriteIds.join(",");

  useEffect(() => {
    if (!favoritesOnly || favoriteIds.length === 0) return;

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        favoriteIds.map(async (id) => {
          try {
            const data = await getJson<{ product: PublicProduct }>(
              `/api/products/${id}`,
            );

            return data.product;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      setFavoritesData({
        key: favoritesKey,
        items: results.filter((product): product is PublicProduct =>
          Boolean(product),
        ),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [favoritesOnly, favoriteIds, favoritesKey]);

  /* ---------- estado que ve el catálogo ---------- */

  let catalogState: CatalogState;

  if (favoritesOnly) {
    const loadingFavorites =
      favoriteIds.length > 0 && favoritesData.key !== favoritesKey;

    const items =
      favoriteIds.length === 0
        ? []
        : favoritesData.items.filter((product) =>
            favoriteIds.includes(product.id),
          );

    catalogState = {
      status: loadingFavorites ? "loading" : "ready",
      items,
      total: items.length,
      hasMore: false,
      loadingMore: false,
    };
  } else {
    catalogState = {
      status:
        catalogData.key !== filterKey
          ? "loading"
          : catalogData.error
            ? "error"
            : "ready",
      items: catalogData.items,
      total: catalogData.total,
      hasMore: catalogData.page < catalogData.totalPages,
      loadingMore: catalogData.loadingMore,
    };
  }

  /* ---------- acciones ---------- */

  function selectCategory(id: string | null) {
    setCategory(id);
    setFavoritesOnly(false);
  }

  function handleSearch(term: string) {
    setSearch(term);
    setFavoritesOnly(false);
  }

  function handleAdd(product: PublicProduct) {
    addToCart(product);
    setCartOpen(true);
  }

  function openDetail(product: PublicProduct) {
    setCombo(null);
    setShoppingError("");
    setSelected(product);
    requestAnimationFrame(() => scrollToId("detalle"));
  }

  function chooseOfferProduct(promotion: PublicPromotion, product: PublicProduct) {
    selectPromotion(promotion.id);
    openDetail(product);
  }

  function buildCombo(promotion: PublicPromotion) {
    if (!canBuildCombo(promotion)) return;
    comboFlight.current = false;
    setShoppingError("");
    setShoppingNotice("");
    setCombo({ promotion, index: 0, choices: [] });
    setSelected(promotion.products![0].product!);
    requestAnimationFrame(() => scrollToId("detalle"));
  }

  function cancelCombo() {
    setCombo(null); setShoppingError("");
    setShoppingNotice("Armado cancelado. No agregamos productos del combo; tu carrito se conserva.");
    requestAnimationFrame(() => scrollToId("shopping-feedback"));
  }

  function addDetail(quantity: number, options: CustomizationOption[], message: string, dedications?: Dedication[], cardQuantity?: number) {
    if (!detailProduct) return false;
    setShoppingError("");
    if (!combo) { addToCart(detailProduct, quantity, options, message, dedications, cardQuantity); setCartOpen(true); return true; }
    if (comboFlight.current) return false;
    comboFlight.current = true;
    const choices = [...combo.choices, { product: detailProduct, quantity, options, message, dedications, cardQuantity }];
    const next = combo.index + 1;
    if (next < combo.promotion.products!.length) {
      setCombo({ ...combo, index: next, choices });
      setSelected(combo.promotion.products![next].product!);
      requestAnimationFrame(() => scrollToId("detalle"));
      return true;
    } else {
      try { addComboToCart(choices); selectPromotion(combo.promotion.id); setCombo(null); setCartOpen(true); return true; }
      catch (cause) { setShoppingError(cause instanceof Error ? cause.message : "No se pudo agregar el combo completo."); comboFlight.current = false; return false; }
    }
  }

  /* ---------- derivados ---------- */

  const detailProduct = selected ?? catalogState.items[0] ?? null;
  const categoryName =
    meta.categories.find((entry) => entry.id === detailProduct?.category_id)
      ?.name ?? null;

  const whatsappHref = whatsappLink(meta.whatsapp);
  const canOrder = acceptingOrders(meta.status);
  const hoursToday = todayHoursLabel(meta.status);

  const navItems: NavItem[] = [
    { label: "Inicio", href: "#inicio" },
    { label: "Catálogo", href: "#catalogo" },
    ...(meta.promotions.length > 0
      ? [{ label: "Promociones", href: "#promociones" }]
      : []),
    { label: "Nosotros", href: "#nosotros" },
    { label: "Ubicación", href: "#ubicacion" },
    { label: "Contacto", href: "#contacto" },
    { label: "Seguimiento", href: "/seguimiento" },
  ];

  return (
    <main className={`${lato.className} nova-page nova-storefront public-with-bottom-nav min-h-screen bg-[#faf8fb] text-[#28202d]`}>
      <SiteHeader
        navItems={navItems}
        cartCount={cart.count}
        favoritesCount={favoriteIds.length}
        favoritesActive={favoritesOnly}
        searchTerm={search}
        onSearch={handleSearch}
        onToggleFavorites={() => setFavoritesOnly((current) => !current)}
        onOpenCart={() => setCartOpen(true)}
      />

      <ClosedBanner status={meta.status} />

      <HeroSection
        status={meta.status}
        heroProduct={meta.heroProduct}
        hasPromotions={meta.promotions.length > 0}
      />

      <ServiceStrip />

      <CatalogSection
        categories={meta.categories}
        categoriesLoading={!meta.loaded}
        selectedCategory={category}
        onSelectCategory={selectCategory}
        searchTerm={search}
        onClearSearch={() => setSearch("")}
        favoritesOnly={favoritesOnly}
        onShowAll={() => setFavoritesOnly(false)}
        state={catalogState}
        onRetry={() => setReloadToken((current) => current + 1)}
        onLoadMore={() => void loadMore()}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onAdd={handleAdd}
        onOpenDetail={openDetail}
      />

      {shoppingNotice && <div id="shopping-feedback" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-4"><ShoppingNotice onDismiss={() => setShoppingNotice("")}>{shoppingNotice}</ShoppingNotice></div>}
      <PromotionSection key={offerReturn} promotions={meta.promotions} initialPromotionId={selectedPromotionId} onChooseProduct={chooseOfferProduct} onBuildCombo={buildCombo}/>

      {detailProduct ? (
        <ProductDetailSection
          key={`${detailProduct.id}:${combo?.promotion.id ?? "single"}:${combo?.index ?? 0}`}
          product={detailProduct}
          categoryName={categoryName}
          isFavorite={favoriteIds.includes(detailProduct.id)}
          onToggleFavorite={() => toggleFavorite(detailProduct.id)}
          onAdd={addDetail}
          requiredQuantity={combo?.promotion.products![combo.index].quantity}
          actionLabel={combo ? combo.index + 1 < combo.promotion.products!.length ? "Continuar al siguiente producto" : "Agregar combo al carrito" : undefined}
          promotion={combo?.promotion ?? meta.promotions.find(promotion => promotion.id === selectedPromotionId && promotion.products?.some(line => line.product_id === detailProduct.id))}
          comboGuide={combo ? { step: combo.index + 1, total: combo.promotion.products!.length, cancel: cancelCombo } : undefined}
          error={shoppingError}
        />
      ) : null}

      <AboutSection />

      <LocationSection location={meta.location} hours={hoursToday} week={meta.week} loading={!meta.loaded} unavailable={meta.locationUnavailable} />

      <ContactSection whatsappHref={whatsappHref} status={meta.status} week={meta.week} />

      <SiteFooter
        categories={meta.categories}
        week={meta.week}
        whatsappHref={whatsappHref}
        year={year}
        location={meta.location}
        onSelectCategory={(id) => {
          selectCategory(id);
          scrollToId("catalogo");
        }}
      />

      <MobileNavigation/>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onBrowse={() => scrollToId("catalogo")}
        acceptingOrders={canOrder}
        closedNotice={
          canOrder
            ? null
            : `Estamos cerrados y no recibimos pedidos fuera de horario.${
                hoursToday && hoursToday !== "Cerrado"
                  ? ` Horario de hoy: ${hoursToday}.`
                  : ""
              }`
        }
        whatsappNumber={meta.whatsapp}
        promotions={meta.promotions}
        onReturnToOffer={() => { setOfferReturn(value => value + 1); requestAnimationFrame(() => scrollToId("promociones")); }}
      />
    </main>
  );
}
