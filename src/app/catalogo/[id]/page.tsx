"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ProductGallery,
  type ProductImage,
} from "@/components/public/product/product-gallery";

import { ProductInfo } from "@/components/public/product/product-info";

import { usePublicCart } from "@/components/public/cart/public-cart-provider";

type CustomizationOption = {
  id: string;
  option_type: string;
  name: string;
  value: string | null;
  extra_price: number;
};

type ProductComponent = {
  id: string;
  quantity: number;
  component_product: {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
    is_sold_out: boolean;
  } | null;
};

type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  occasion: string | null;
  season_id: string | null;
  is_featured: boolean;
  is_available: boolean;
  is_sold_out: boolean;
  catalog_order: number;
  images: ProductImage[];
  components: ProductComponent[];
  customization_options: CustomizationOption[];
};

type ProductResponse = {
  success: boolean;
  product?: ProductDetail;
  message?: string;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { addItem } = usePublicCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${params.id}`);

        const data = (await response.json()) as ProductResponse;

        if (!response.ok || !data.success || !data.product) {
          throw new Error(
            data.message ?? "No se pudo cargar el producto.",
          );
        }

        setProduct(data.product);
      } catch (err) {
        console.error("Error cargando producto:", err);

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el producto.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      void loadProduct();
    }
  }, [params.id]);

  function handleAddToCart(optionIds: string[]) {
    if (!product) {
      return;
    }

    const selectedOptions = product.customization_options.filter(
      (option) => optionIds.includes(option.id),
    );

    const image = [...(product.images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    )[0];

    addItem({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: image?.public_url ?? null,
      customization_option_ids: optionIds,
      customization_options: selectedOptions.map((option) => ({
        id: option.id,
        name: option.name,
        value: option.value,
        extra_price: Number(option.extra_price),
      })),
      message: null,
      note: null,
    });

    router.push("/catalogo");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7fb]">
        <div className="mx-auto max-w-[1180px] px-6 py-16 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-[4/5] animate-pulse rounded-3xl bg-[#eee5f0]" />

            <div className="space-y-5 py-5">
              <div className="h-4 w-32 animate-pulse rounded bg-[#eee5f0]" />
              <div className="h-12 w-3/4 animate-pulse rounded bg-[#eee5f0]" />
              <div className="h-8 w-32 animate-pulse rounded bg-[#eee5f0]" />
              <div className="h-24 w-full animate-pulse rounded bg-[#eee5f0]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#faf7fb]">
        <div className="mx-auto flex min-h-[70vh] max-w-[700px] flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl text-[#b9a3c1]">✿</div>

          <h1 className="mt-5 text-2xl font-black text-[#403344]">
            No pudimos encontrar este producto
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#7b707f]">
            {error || "El producto que buscas no está disponible."}
          </p>

          <Link
            href="/catalogo"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#65358e] px-5 text-xs font-black text-white transition hover:bg-[#572d7a]"
          >
            <ArrowLeft size={15} />
            Volver al catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7fb]">
      <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 sm:py-14">
        <Link
          href="/catalogo"
          className="mb-8 inline-flex items-center gap-2 text-xs font-black text-[#6e6372] transition hover:text-[#65358e]"
        >
          <ArrowLeft size={15} />
          Volver al catálogo
        </Link>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery
            images={product.images ?? []}
            productName={product.name}
          />

          <ProductInfo
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              price: Number(product.price),
              occasion: product.occasion,
              is_available: product.is_available,
              is_sold_out: product.is_sold_out,
              customization_options:
                product.customization_options ?? [],
            }}
            onAddToCart={handleAddToCart}
          />
        </div>

        {product.components?.length > 0 && (
          <section className="mt-16 border-t border-[#e8e0ea] pt-12">
            <div className="mb-7">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9270a4]">
                Este arreglo incluye
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#403344]">
                Componentes
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.components.map((component) => {
                if (!component.component_product) {
                  return null;
                }

                return (
                  <div
                    key={component.id}
                    className="rounded-2xl border border-[#e8e0ea] bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-[#403344]">
                        {component.component_product.name}
                      </p>

                      <span className="rounded-full bg-[#f3ebf6] px-3 py-1 text-[10px] font-black text-[#65358e]">
                        x{component.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}