"use client";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/public/safe-image";
import { emptyStorefrontMedia } from "@/lib/public/storefront-media";
export function StorefrontMediaConfiguration() {
  const [kind, setKind] = useState("logo"), [category, setCategory] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [media, setMedia] = useState(emptyStorefrontMedia);
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [uploadVersion, setUploadVersion] = useState(0);
  async function refresh() {
    const [assets, groups] = await Promise.all([fetch("/api/storefront-media").then(r => r.json()), fetch("/api/admin/categories").then(r => r.json())]);
    if (!assets.success || !groups.success) throw Error("No se pudieron cargar las imágenes y categorías.");
    setMedia(assets.media); setCategories(groups.categories);
  }
  useEffect(() => { let active = true; const timer = setTimeout(() => { void refresh().catch(() => { if (active) setError("No se pudo cargar la configuración visual."); }); }, 0); return () => { active = false; clearTimeout(timer); }; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function chooseFile(next: File | null) { setFile(next); setPreview(next ? URL.createObjectURL(next) : null); }
  const current = kind === "category" ? media.categories[category] : kind === "logo" ? media.logo || "/brand/anabelle-horizontal.webp" : media.about;
  return <section className="min-w-0 space-y-4 rounded-2xl border border-border-decorative bg-surface p-5" aria-labelledby="storefront-media-title"><h2 id="storefront-media-title">Imágenes de la tienda</h2><p className="text-sm text-text-secondary">Usa tu logo y fotografías auténticas o comerciales autorizadas. Si no cargas otro logo, se usa la identidad oficial incluida. PNG transparente recomendado para el logo.</p>
    <form className="grid min-w-0 gap-4" onSubmit={async event => {
      event.preventDefault(); if (!file || busy) return; setBusy(true); setError(""); setNotice("");
      try { const form = new FormData(); form.set("kind",kind); if (kind === "category") form.set("category_id",category); form.set("file",file); const response = await fetch("/api/admin/storefront-media", { method: "POST", body: form }); const result = await response.json(); if (!response.ok) throw Error(result.message || "No se pudo guardar."); await refresh(); setNotice("Imagen guardada. La tienda usará esta imagen al recargar."); chooseFile(null); setUploadVersion(value => value + 1); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar."); } finally { setBusy(false); }
    }}><label className="grid gap-2 text-sm">Destino<select className="min-h-11 rounded-xl border border-border-field bg-surface p-3" value={kind} onChange={event => { setKind(event.target.value); chooseFile(null); }}><option value="logo">Logo de la florería</option><option value="about">Fotografía de Nosotros</option><option value="category">Imagen de categoría</option></select></label>
      {kind === "category" && <label className="grid gap-2 text-sm">Categoría<select required value={category} onChange={event => { setCategory(event.target.value); chooseFile(null); }} className="min-h-11 rounded-xl border border-border-field bg-surface p-3"><option value="">Seleccionar categoría</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {preview ? /* Local object URL: never transmitted until Guardar imagen. */ <picture><img src={preview} alt="Vista previa del archivo seleccionado" className="max-h-44 max-w-full rounded-xl object-contain"/></picture> : current ? <SafeImage src={current} width={240} height={160} className="max-h-44 max-w-full rounded-xl object-contain" alt="Imagen configurada"/> : <p className="rounded-xl bg-brand-soft p-4 text-sm">Sin imagen configurada. Se conserva el recurso floral provisional.</p>}
      <label className="grid gap-2 text-sm">Imagen (PNG, JPG o WebP, hasta 5 MB)<input key={kind + category + uploadVersion} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const next = event.target.files?.[0]; setError(""); if (next && (next.size > 5 * 1024 * 1024 || !["image/png","image/jpeg","image/webp"].includes(next.type))) { chooseFile(null); setError("Selecciona PNG, JPG o WebP de hasta 5 MB."); return; } chooseFile(next ?? null); }}/></label><button disabled={busy || !file || (kind === "category" && !category)} className="min-h-11 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Guardando imagen…" : "Guardar imagen"}</button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}{notice && <p role="status" className="text-sm text-leaf">{notice}</p>}
    </form></section>;
}
