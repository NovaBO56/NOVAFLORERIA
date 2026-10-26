"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ProductPhoto } from "./product-recommendation-photo";
import { recommendationImage, recommendationStatus, type RecommendationChoice } from "./recommendation-options";

export function ProductRecommendationPicker({ selected, principal = "", max = 4, allowUnavailable = false, onPick }: { selected: string[]; principal?: string; max?: number; allowUnavailable?: boolean; onPick: (product: RecommendationChoice) => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [products, setProducts] = useState<RecommendationChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      void (async () => {
        try {
          const response = await fetch(`/api/admin/products?limit=12&page=${page}&search=${encodeURIComponent(search.trim())}`, { signal: controller.signal });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error();
          let choices: (RecommendationChoice & { calculated_available?: boolean; calculated_sold_out?: boolean })[] = result.products;
          if (!allowUnavailable && choices.length) {
            if (choices.some(p => typeof p.calculated_available !== "boolean" || typeof p.calculated_sold_out !== "boolean")) throw new Error();
            choices = choices.map(p => ({ ...p, is_available: p.calculated_available!, is_sold_out: p.calculated_sold_out! }));
          }
          if (!controller.signal.aborted) { setProducts(choices.filter(p => p.id !== principal)); setPages(result.pagination.total_pages); }
        } catch { if (!controller.signal.aborted) { setProducts([]); setError("No pudimos buscar o comprobar los productos. Intenta nuevamente."); } }
        finally { if (!controller.signal.aborted) setLoading(false); }
      })();
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page, principal, allowUnavailable, attempt]);
  return <section aria-label="Buscar productos existentes" className="space-y-3 rounded-xl border border-border-decorative p-3">
    <label htmlFor={id} className="text-sm font-medium">Buscar producto existente</label>
    <Input id={id} ref={input} value={search} placeholder="Busca oso, peluche, chocolates, globo…" onChange={e => { setSearch(e.target.value); setPage(1); }} />
    <p className="text-xs text-text-secondary">{selected.length} de {max} seleccionados. Búsqueda paginada del catálogo.</p>
    {loading ? <p role="status">Buscando productos…</p> : error ? <div role="status"><p>{error}</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Reintentar</Button></div> : !products.length ? <p role="status">No encontramos productos con esa búsqueda.</p> : <ul className="space-y-2">{products.map(p => <li key={p.id} className="rounded-xl border border-border-decorative p-3">
      <div className="flex items-start gap-3"><ProductPhoto id={p.id} imageUrl={recommendationImage(p)} /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{p.name}</p><p className="text-sm font-semibold">Bs {Number(p.price).toFixed(2)}</p><p className="text-xs text-text-secondary">{recommendationStatus(p)}</p></div></div>
      <Button className="mt-2 min-h-11 w-full" variant="outline" disabled={selected.includes(p.id) || selected.length >= max || (!allowUnavailable && recommendationStatus(p) !== "Disponible")} onClick={() => onPick(p)}>{selected.includes(p.id) ? "Seleccionado" : "+ Añadir"}</Button>
    </li>)}</ul>}
    <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</Button><span className="text-xs">{page} de {pages}</span><Button variant="outline" disabled={loading || page >= pages} onClick={() => setPage(value => value + 1)}>Siguiente</Button></div>
  </section>;
}
