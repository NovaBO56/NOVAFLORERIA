"use client";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import { emptyGlobalRecommendations, type GlobalRecommendations } from "@/validations/product-recommendations";
import { ProductRecommendationPicker } from "./product-recommendation-picker";
import { ProductPhoto } from "./product-recommendation-photo";
import { recommendationImage, moveRecommendation, recommendationStatus, type RecommendationChoice } from "./recommendation-options";
import { ResolvedRecommendationPreview } from "./resolved-recommendation-preview";

function CategoryChoices({ label, categories, values, onChange }: { label: string; categories: { id: string; name: string }[]; values: string[]; onChange: (values: string[]) => void }) {
  return <fieldset className="min-w-0 space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="grid gap-2 sm:grid-cols-2">{categories.map(category => <label key={category.id} className="flex min-h-11 items-center gap-2 rounded-xl border border-border-decorative p-2 text-sm"><input type="checkbox" checked={values.includes(category.id)} onChange={event => onChange(event.target.checked ? [...values, category.id] : values.filter(id => id !== category.id))} className="size-4 shrink-0 accent-brand" /><span className="break-words">{category.name}</span></label>)}</div></fieldset>;
}
export function GlobalProductRecommendations({ categories, onDirtyChange }: { categories: { id: string; name: string }[]; onDirtyChange: (dirty: boolean) => void }) {
  const [config, setConfig] = useState<GlobalRecommendations>(emptyGlobalRecommendations);
  const [saved, setSaved] = useState<GlobalRecommendations>(emptyGlobalRecommendations);
  const [products, setProducts] = useState<RecommendationChoice[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [attempt, setAttempt] = useState(0);
  const [picker, setPicker] = useState<"global" | "exclude" | "preview" | null>(null);
  const [preview, setPreview] = useState<RecommendationChoice | null>(null);
  const dirty = JSON.stringify(config) !== JSON.stringify(saved);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    let active = true;
    void fetch("/api/admin/product-recommendations").then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "No pudimos consultar los complementos.");
      if (active) { setConfig(result.config); setSaved(result.config); setProducts(result.products); setReady(true); }
    }).catch(error => { if (active) { setMessageTone("error"); setMessage(error instanceof Error ? error.message : "No se pudo cargar."); } });
    return () => { active = false; };
  }, [attempt]);
  async function save() {
    setBusy(true); setMessage(""); setMessageTone("error");
    try {
      const response = await fetch("/api/admin/product-recommendations", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(config) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "No se pudieron guardar los cambios.");
      const next = { ...config, revision: result.revision };
      setConfig(next); setSaved(next); setMessageTone("success"); setMessage("Cambios guardados correctamente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudieron guardar los cambios. Puedes intentarlo nuevamente."); }
    finally { setBusy(false); }
  }
  function reload() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos y recargar la configuración guardada?")) return;
    setAttempt(value => value + 1); setMessage(""); setMessageTone("error");
  }
  return <section aria-label="Complementos globales" className="space-y-5 rounded-xl border border-border-decorative bg-surface p-4 shadow-card sm:p-6 [&_button]:min-h-11">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Gift aria-hidden="true" className="size-5 text-brand" />Complementos</h2>
    <p className="text-sm text-text-secondary">Administra los regalos adicionales que puedes ofrecer al cliente después de agregar un producto al carrito. Configúralos una sola vez y decide dónde aparecerán.</p>
    <p className="rounded-xl bg-brand-soft p-3 text-sm">Son productos comerciales existentes, no materiales de receta ni promociones. Conservan su precio, personalización e inventario compartido. El cliente puede continuar sin extras.</p>
    {!ready ? <div>{message ? <Notice tone="error">{friendlyErrorMessage(message, "No pudimos cargar los complementos.")}</Notice> : <p role="status">Cargando configuración…</p>}<Button variant="outline" onClick={reload}>Reintentar</Button></div> : <fieldset disabled={busy} className="min-w-0 space-y-5">
      <label className="flex min-h-11 items-center gap-3 font-medium"><input type="checkbox" className="size-5 accent-brand" checked={config.enabled} onChange={e => setConfig(value => ({ ...value, enabled: e.target.checked }))} />Ofrecer complementos globales</label>
      <p className="text-xs text-text-secondary">Solo afecta a productos en modo global. Las recomendaciones personalizadas siguen funcionando.</p>
      <div className="admin-form-section space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Prioridad de sugerencias</h3><span className="text-sm">{config.product_ids.length} de 20</span></div>
        {!config.product_ids.length && <div className="rounded-xl border border-dashed border-border-field p-4"><p className="font-medium">Todavía no tienes complementos globales.</p><p className="mt-1 text-sm text-text-secondary">Añade osos, chocolates, globos u otros productos existentes y disponibles.</p></div>}
        <ol className="space-y-3">{config.product_ids.map((id, index) => {
          const product = products.find(p => p.id === id);
          return <li key={id} className="space-y-3 rounded-xl border border-border-decorative p-3"><div className="flex items-start gap-3"><span className="text-sm font-semibold">{index + 1}.</span><ProductPhoto id={product?.id} imageUrl={recommendationImage(product)} alt={product?.name ?? "Complemento"} /><div className="min-w-0 flex-1"><p className="break-words font-medium">{product?.name ?? "Referencia no resuelta; se conserva"}</p>{product && <><p className="text-sm">Bs {Number(product.price).toFixed(2)}</p><p className="text-xs text-text-secondary">{recommendationStatus(product)}</p></>}</div></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={index === 0} aria-label={`Subir sugerencia ${index + 1}`} onClick={() => setConfig(value => ({ ...value, product_ids: moveRecommendation(value.product_ids, index, -1) }))}>Subir</Button><Button variant="outline" disabled={index === config.product_ids.length - 1} aria-label={`Bajar sugerencia ${index + 1}`} onClick={() => setConfig(value => ({ ...value, product_ids: moveRecommendation(value.product_ids, index, 1) }))}>Bajar</Button><Button variant="ghost" onClick={() => setConfig(value => ({ ...value, product_ids: value.product_ids.filter(candidate => candidate !== id) }))}>Quitar de recomendaciones</Button></div>
          </li>;
        })}</ol>
        <Button variant="outline" disabled={config.product_ids.length >= 20} onClick={() => setPicker(picker === "global" ? null : "global")}>+ Añadir producto existente</Button>
        <p className="text-xs text-text-secondary">El cliente verá hasta cuatro opciones disponibles, en este orden. La lista de hasta veinte permite alternativas si se agota un producto.</p>
      </div>
      {picker === "global" && <ProductRecommendationPicker max={20} selected={config.product_ids} onPick={product => { setProducts(value => [...value.filter(p => p.id !== product.id), product]); setConfig(value => ({ ...value, product_ids: value.product_ids.includes(product.id) || value.product_ids.length >= 20 ? value.product_ids : [...value.product_ids, product.id] })); }} />}
      <label className="block text-sm font-medium">Dónde aparecen<select className="mt-2 min-h-11 w-full rounded-xl border border-border-field bg-surface px-3" value={config.scope} onChange={e => setConfig(value => ({ ...value, scope: e.target.value as "all" | "categories" }))}><option value="all">Todos los productos elegibles</option><option value="categories">Solo determinadas categorías</option></select></label>
      {config.scope === "categories" && <CategoryChoices label="Categorías incluidas" categories={categories} values={config.category_ids} onChange={ids => setConfig(value => ({ ...value, category_ids: ids }))} />}
      <details className="rounded-xl border border-border-decorative p-3"><summary className="min-h-11 cursor-pointer font-medium">Exclusiones</summary><p className="my-2 text-sm text-text-secondary">No ofrecer complementos globales cuando el producto principal pertenezca a estas categorías o esté en esta lista. El producto principal y los extras ya en el carrito siempre se excluyen de las sugerencias.</p>
        <CategoryChoices label="Categorías excluidas" categories={categories} values={config.excluded_category_ids} onChange={ids => setConfig(value => ({ ...value, excluded_category_ids: ids }))} />
        <ul className="my-3 space-y-2">{config.excluded_product_ids.map(id => <li key={id} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0 break-words">{products.find(p => p.id === id)?.name ?? "Referencia no resuelta"}</span><Button variant="ghost" onClick={() => setConfig(value => ({ ...value, excluded_product_ids: value.excluded_product_ids.filter(candidate => candidate !== id) }))}>Quitar exclusión</Button></li>)}</ul>
        <Button variant="outline" disabled={config.excluded_product_ids.length >= 200} onClick={() => setPicker(picker === "exclude" ? null : "exclude")}>Excluir producto</Button>
        {picker === "exclude" && <ProductRecommendationPicker max={200} allowUnavailable selected={config.excluded_product_ids} onPick={product => { setProducts(value => [...value.filter(p => p.id !== product.id), product]); setConfig(value => ({ ...value, excluded_product_ids: value.excluded_product_ids.includes(product.id) || value.excluded_product_ids.length >= 200 ? value.excluded_product_ids : [...value.excluded_product_ids, product.id] })); }} />}
      </details>
      <div className="admin-form-section space-y-3"><h3 className="font-semibold">Vista previa</h3><p className="text-sm text-text-secondary">Comprueba el resultado guardado para un producto. Las excepciones individuales se administran en su editor.</p><Button variant="outline" onClick={() => setPicker(picker === "preview" ? null : "preview")}>Elegir producto para vista previa</Button>
        {picker === "preview" && <ProductRecommendationPicker selected={[]} max={1} allowUnavailable onPick={product => { setPreview(product); setPicker(null); }} />}
        {preview && <div><p className="mb-2 break-words text-sm">{preview.name}</p><ResolvedRecommendationPreview key={`${preview.id}:${saved.revision}`} productId={preview.id} /></div>}
      </div>
      <div className="admin-form-actions sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border-decorative bg-surface py-4">{message ? <Notice tone={messageTone}>{messageTone === "error" ? friendlyErrorMessage(message, "No pudimos guardar los complementos. Intenta nuevamente.") : message}</Notice> : <p className="text-sm">{dirty ? "Cambios sin guardar" : "Configuración guardada"}</p>}<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={reload}>Recargar</Button><Button disabled={!dirty} loading={busy} onClick={() => void save()}>Guardar complementos globales</Button></div></div>
    </fieldset>}
  </section>;
}
