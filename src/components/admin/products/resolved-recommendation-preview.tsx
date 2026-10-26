"use client";
import { useEffect, useState } from "react";
import { ProductPhoto } from "./product-recommendation-photo";
import { recommendationImage, type RecommendationChoice } from "./recommendation-options";
export function ResolvedRecommendationPreview({ productId }: { productId: string }) {
  const [products, setProducts] = useState<RecommendationChoice[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch(`/api/admin/product-recommendations/preview?product_id=${productId}`).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error();
      if (active) setProducts(result.products);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [productId]);
  return <section className="space-y-3 rounded-xl bg-brand-soft p-4" aria-label="Vista previa resuelta"><h4 className="font-semibold">Vista previa de la configuración guardada</h4><p className="text-xs text-text-secondary">El cliente elige si añade extras. Los precios son los del catálogo actual; no se añaden productos ni se consume inventario al consultar.</p>
    {error ? <p role="status">No pudimos resolver esta vista previa.</p> : products === null ? <p role="status">Consultando…</p> : !products.length ? <p>No hay complementos elegibles para este producto.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{products.map(p => <article key={p.id} className="min-w-0 rounded-xl bg-surface p-3"><ProductPhoto id={p.id} preview imageUrl={recommendationImage(p)} /><p className="break-words text-sm font-semibold">{p.name}</p><p className="text-sm">Bs {Number(p.price).toFixed(2)}</p><span className="mt-2 block text-sm font-bold text-brand">Elegir</span></article>)}</div>}
  </section>;
}
