import { ArrowRight } from "lucide-react";
import Link from "next/link";

export type PublicProduct = {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  occasion: string | null;
  season_id: string | null;
  is_featured: boolean;
  is_available: boolean;
  is_sold_out: boolean;
  catalog_order: number;
  images: {
    id: string;
    public_url: string;
    alt_text: string | null;
    sort_order: number;
  }[];
};

type ProductCardProps = {
  product: PublicProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = [...(product.images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0];

  const unavailable = !product.is_available || product.is_sold_out;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e8e0ea] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(65,39,75,.10)]">
      <Link href={`/catalogo/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#eee5f0]">
          {image?.public_url ? (
            <img
              src={image.public_url}
              alt={image.alt_text ?? product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-7xl text-[#b9a3c1]">✿</span>
            </div>
          )}

          {product.is_featured && (
            <span className="absolute left-4 top-4 rounded-full bg-[#65358e] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
              Destacado
            </span>
          )}

          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#403344]/45">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#403344]">
                {product.is_sold_out ? "Agotado" : "No disponible"}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9270a4]">
            {product.occasion ?? "Arreglo floral"}
          </p>

          <h3 className="mt-2 line-clamp-2 text-lg font-black text-[#403344]">
            {product.name}
          </h3>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-base font-black text-[#65358e]">
              Bs {Number(product.price).toFixed(2)}
            </p>

            <span className="inline-flex items-center gap-1 text-xs font-black text-[#6e6372] transition group-hover:text-[#65358e]">
              Ver detalle
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}