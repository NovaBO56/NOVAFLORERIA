"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Gift, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { ProductPhoto } from "./product-recommendation-photo";
import { ProductRecommendationPicker } from "./product-recommendation-picker";
import { ResolvedRecommendationPreview } from "./resolved-recommendation-preview";
import { recommendationImage, recommendationStatus, canAddRecommendation, moveRecommendation, recommendationPreview, type RecommendationChoice, type RecommendationAvailability } from "./recommendation-options";

function ProductInfo({ product, catalogPending = false, availabilityPending = false }: { product?: RecommendationChoice; catalogPending?: boolean; availabilityPending?: boolean }) {
  return <><ProductPhoto id={product?.id} imageUrl={recommendationImage(product)} alt={product?.name ?? "Complemento"} /><div className="min-w-0 flex-1">
    <p className="break-words text-sm font-medium">{product?.name ?? (catalogPending ? "Cargando producto…" : "Referencia no resuelta")}</p>
    {product && <p className="text-sm font-semibold tabular-nums">Bs {Number(product.price).toFixed(2)}</p>}
    <p className="text-xs text-text-secondary">{product ? availabilityPending && product.is_active ? "Disponibilidad pendiente de comprobar" : recommendationStatus(product) : catalogPending ? "Consultando catálogo…" : "No pudimos encontrar este producto. Se conserva sin cambios."}</p>
  </div></>;
}
export function ProductRecommendations({ productId, onCountChange, onDirtyChange }: { productId: string; onCountChange?: (count: number) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [choices, setChoices] = useState<RecommendationChoice[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [availability, setAvailability] = useState<RecommendationAvailability>({});
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [mode, setMode] = useState<"global" | "custom" | "off">("global");
  const [savedMode, setSavedMode] = useState<"global" | "custom" | "off">("global");
  const [revision, setRevision] = useState(0);
  const visibleIds = selected.join(",");
  useEffect(() => {
    let active = true;
    const ids = visibleIds.split(",").filter(Boolean);
    if (!ids.length) return;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const values: Record<string, { is_available: boolean; is_sold_out: boolean }> = {};
          for (let i = 0; i < ids.length; i += 50) {
            const response = await fetch("/api/products/availability", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: ids.slice(i, i + 50).map(product_id => ({ product_id, quantity: 1 })), combine: false }) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error();
            for (const row of result.availability) values[row.product_id] = { is_available: row.is_available, is_sold_out: row.is_sold_out };
          }
          if (active) { setAvailability(previous => ({ ...previous, ...values })); setAvailabilityError(""); }
        } catch { if (active) setAvailabilityError("No pudimos comprobar la disponibilidad actual. Pulsa «Reintentar disponibilidad»; tu selección se conserva."); }
      })();
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [visibleIds, availabilityAttempt]);
  useEffect(() => {
    if (ready) return;
    let active = true;
    void fetch(`/api/admin/products/${productId}/recommendations`).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error();
      if (active) { setSelected(result.product_ids); setSaved(result.product_ids); setChoices(result.products ?? []); setCatalogReady(true); setMode(result.mode); setSavedMode(result.mode); setRevision(result.revision); setReady(true); }
    }).catch(() => { if (active) { setMessageTone("error"); setMessage("No pudimos cargar la configuración. Intenta nuevamente."); } });
    return () => { active = false; };
  }, [productId, loadAttempt, ready]);
  useEffect(() => { if (ready) onCountChange?.(selected.length); }, [ready, selected.length, onCountChange]);
  async function save() {
    setBusy(true); setMessage(""); setMessageTone("error");
    try {
      const response = await fetch(`/api/admin/products/${productId}/recommendations`, {
        method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, revision, ...(mode === "custom" ? { product_ids: selected } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) { setMessage(result.message ?? "No se pudo guardar."); return; }
      setSaved([...selected]); setSavedMode(mode); setRevision(result.revision); setMessageTone("success"); setMessage("Cambios guardados correctamente.");
    } catch { setMessage("No se pudo guardar. Tu selección se conserva para reintentar."); }
    finally { setBusy(false); }
  }
  const dirty = mode !== savedMode || JSON.stringify(saved) !== JSON.stringify(selected);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  const currentChoices = choices.map(p => ({ ...p, ...availability[p.id] }));
  const available = recommendationPreview(choices, selected, availability);
  return <div className="space-y-5 [&_button]:min-h-11">
    <label className="block text-sm font-medium">Cómo recomendar para este producto<select className="mt-2 min-h-11 w-full rounded-xl border border-border-field bg-surface px-3 text-base" disabled={!ready || busy} value={mode} onChange={e => { if (mode === "custom" && JSON.stringify(selected) !== JSON.stringify(saved)) { if (!window.confirm("Hay cambios personalizados sin guardar. ¿Quieres descartarlos para cambiar de modo?")) return; setSelected([...saved]); } setMode(e.target.value as typeof mode); }}><option value="global">Usar complementos globales</option><option value="custom">Usar complementos personalizados</option><option value="off">No mostrar complementos</option></select></label>
    {mode === "global" && <p className="text-sm text-text-secondary">Hereda la configuración de Gestión de productos → Complementos. Las recomendaciones personalizadas anteriores se conservan.</p>}
    {mode === "off" && <p className="text-sm text-text-secondary">Este producto no ofrecerá complementos. Las recomendaciones anteriores se conservan por si deseas volver a utilizarlas.</p>}
    {mode === "global" && ready && <ResolvedRecommendationPreview key={revision} productId={productId} />}
    <div hidden={mode !== "custom"} className="space-y-5">
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><Gift aria-hidden="true" className="size-5 text-brand" />Complementos recomendados</h3>
      <p className="text-sm">Selecciona los regalos adicionales que quieres ofrecer al cliente después de agregar este producto al carrito.</p>
      <p className="text-sm text-text-secondary">Estos complementos son opcionales. El cliente decide si quiere añadirlos y solo se cobran cuando los selecciona.</p>
      <p className="rounded-xl bg-bg-admin p-3 text-sm text-text-secondary">No son materiales incluidos en la receta ni promociones. Son otros productos que se venden por separado.</p>
    </div>
    {!ready ? <p role="status">Cargando configuración…</p> : selected.length === 0 ? <div className="rounded-xl border border-dashed border-border-field p-4">
      <p className="font-medium">Este producto todavía no tiene complementos configurados.</p>
      <p className="mt-2 text-sm text-text-secondary">Puedes recomendar osos, chocolates, globos u otros productos disponibles.</p>
    </div> : <ol aria-label="Complementos configurados" className="space-y-3">{selected.map((id, index) => {
      const product = currentChoices.find(p => p.id === id);
      return <li key={id} className="rounded-xl border border-border-decorative p-3">
        <div className="flex items-start gap-3"><span className="sr-only">Posición </span><span className="text-sm font-semibold">{index + 1}.</span><ProductInfo product={product} catalogPending={!catalogReady} availabilityPending={!availability[id]} /></div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" disabled={index === 0 || busy} aria-label={`Subir complemento ${index + 1}`} onClick={() => setSelected(list => moveRecommendation(list, index, -1))}><ArrowUp aria-hidden="true" />Subir</Button>
          <Button variant="outline" className="min-h-11" disabled={index === selected.length - 1 || busy} aria-label={`Bajar complemento ${index + 1}`} onClick={() => setSelected(list => moveRecommendation(list, index, 1))}><ArrowDown aria-hidden="true" />Bajar</Button>
          <Button variant="ghost" className="min-h-11" disabled={busy} aria-label={`Quitar complemento ${index + 1}`} onClick={() => setSelected(list => list.filter(p => p !== id))}><Trash2 aria-hidden="true" />Quitar</Button>
        </div>
        {product && recommendationStatus(product) !== "Disponible" && <p className="mt-2 text-xs text-text-secondary">Se conserva en la configuración. No se ofrecerá al cliente mientras no esté disponible.</p>}
      </li>;
    })}</ol>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button variant="outline" disabled={!ready || busy} aria-expanded={pickerOpen} aria-controls="recommendation-picker" onClick={() => setPickerOpen(open => !open)}><Plus aria-hidden="true" />Añadir complemento</Button>
      <span role="status" className="text-sm text-text-secondary">{ready ? `${selected.length} de 4 configurados` : "Cargando…"}</span>
    </div>
    {pickerOpen && <ProductRecommendationPicker selected={selected} principal={productId} onPick={p => { if (!canAddRecommendation(p, productId, selected)) return; setChoices(previous => [...previous.filter(choice => choice.id !== p.id), p]); setAvailability(previous => ({ ...previous, [p.id]: { is_available: p.is_available, is_sold_out: p.is_sold_out } })); setSelected(previous => previous.includes(p.id) || previous.length >= 4 ? previous : [...previous, p.id]); }} />}
    {ready && <section aria-label="Vista previa para el cliente" className="rounded-xl bg-brand-soft p-4">
      <h4 className="font-semibold">Vista previa para el cliente</h4>
      <p className="mt-1 text-xs text-text-secondary">El cliente añade el producto principal, pulsa «Elegir» para ver el detalle del complemento y decide si lo agrega al carrito. Puede seguir comprando sin añadir ninguno.</p>
      <p className="mt-2 text-xs text-text-secondary">Precios actuales, sin descuentos adicionales. Los complementos que ya estén en el carrito no se vuelven a ofrecer. Esta vista previa no añade productos.</p>
      <h5 className="mt-3 text-sm font-semibold">¿Quieres complementar tu regalo?</h5>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{available.map(p => <article key={p.id} className="min-w-0 rounded-xl border border-border-decorative bg-surface p-3"><ProductPhoto id={p.id} preview imageUrl={recommendationImage(p)} alt={p.name} /><p className="break-words text-sm font-semibold">{p.name}</p><p className="mt-1 text-sm tabular-nums">Bs {Number(p.price).toFixed(2)}</p><span className="mt-2 block text-sm font-bold text-brand">Elegir</span></article>)}</div>
      {!available.length && <p className="mt-3 text-sm">{!catalogReady || selected.some(id => !availability[id]) ? "Disponibilidad pendiente de comprobar. La vista previa se actualizará al obtenerla." : "No hay complementos disponibles para mostrar."}</p>}
    </section>}
    </div>
    <div className="sticky -bottom-4 z-10 space-y-2 border-t border-border-decorative bg-surface py-3">
      {message && <Notice tone={messageTone}>{messageTone === "error" ? friendlyErrorMessage(message, "No pudimos guardar los complementos. Tu selección se conserva.") : message}</Notice>}
      {availabilityError && <div className="space-y-2"><Notice tone="warning">{friendlyErrorMessage(availabilityError, "No pudimos comprobar la disponibilidad. Intenta nuevamente.")}</Notice><Button variant="outline" onClick={() => setAvailabilityAttempt(value => value + 1)}>Reintentar disponibilidad</Button></div>}
      {(!ready || !catalogReady) && message && <Button variant="outline" onClick={() => { setMessage(""); setLoadAttempt(value => value + 1); }}>Reintentar carga</Button>}
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-text-secondary">{dirty ? "Cambios sin guardar" : "Configuración guardada"}</p><Button disabled={!ready || !catalogReady || !dirty} loading={busy} onClick={() => void save()}>Guardar complementos</Button></div>
    </div>
  </div>;
}
