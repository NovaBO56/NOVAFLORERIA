"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "../catalog/product-grid";
import type { PublicProduct } from "../catalog/product-card";

type ProductsResponse = {
  success: boolean;
  products: PublicProduct[];
  message?: string;
};

export function FeaturedProducts() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const response = await fetch(
          "/api/products?is_featured=true&limit=4&page=1",
        );

        const data = (await response.json()) as ProductsResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ?? "No se pudieron cargar los destacados.",
          );
        }

        setProducts(data.products ?? []);
      } catch (error) {
        console.error("Error cargando productos destacados:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadFeaturedProducts();
  }, []);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-[#9270a4]" />

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
                Selección NOVA
              </span>
            </div>

            <h2 className="text-3xl font-black text-[#403344] sm:text-4xl">
              Nuestros favoritos
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#756a79] sm:text-base">
              Arreglos destacados para ayudarte a encontrar ese detalle
              especial.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 self-start text-xs font-black text-[#65358e] transition hover:text-[#4f286e] sm:self-auto"
          >
            Ver todo el catálogo
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#e8e0ea] bg-white"
              >
                <div className="aspect-[4/5] animate-pulse bg-[#eee5f0]" />

                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#eee5f0]" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[#eee5f0]" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[#eee5f0]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </section>
  );
}