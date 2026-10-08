"use client";

import { useEffect, useState } from "react";
import {
  acceptingOrders,
  todayHoursLabel,
  whatsappLink,
} from "@/lib/public/format";
import { createLocalStore } from "@/lib/public/local-store";
import type {
  BusinessStatus,
  PublicCategory,
  PublicProduct,
  PublicPromotion,
  WeekDay,
} from "@/lib/public/types";
import { addToCart, CartDrawer, useCart } from "./cart";
import { CatalogSection, type CatalogState } from "./catalog";
import { SiteHeader, type NavItem } from "./header";
import { ProductDetailSection } from "./product-detail";
import {
  AboutSection,
  ClosedBanner,
  ContactSection,
  HeroSection,
  PromotionSection,
  ServiceStrip,
  SiteFooter,
} from "./sections";
import { lato, scrollToId } from "./shared";

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

  /* ---------- datos generales (una sola vez) ---------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [categories, hours, whatsapp, promotions, featured, all] =
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
        ]);

      if (cancelled) return;

      const allResult = settled(all);

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
    setSelected(product);
    scrollToId("detalle");
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
    { label: "Contacto", href: "#contacto" },
    { label: "Seguimiento", href: "/seguimiento" },
  ];

  return (
    <main className={`${lato.className} nova-page nova-storefront min-h-screen bg-[#faf8fb] text-[#28202d]`}>
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
        totalProducts={meta.totalProducts}
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

      <PromotionSection promotions={meta.promotions} />

      {detailProduct ? (
        <ProductDetailSection
          key={detailProduct.id}
          product={detailProduct}
          categoryName={categoryName}
          isFavorite={favoriteIds.includes(detailProduct.id)}
          onToggleFavorite={() => toggleFavorite(detailProduct.id)}
          onAdd={(quantity, options, message) => {
            addToCart(detailProduct, quantity, options, message);
            setCartOpen(true);
          }}
        />
      ) : null}

      <AboutSection />

      <ContactSection whatsappHref={whatsappHref} status={meta.status} />

      <SiteFooter
        categories={meta.categories}
        week={meta.week}
        whatsappHref={whatsappHref}
        year={year}
        onSelectCategory={(id) => {
          selectCategory(id);
          scrollToId("catalogo");
        }}
      />

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
      />
    </main>
  );
}
