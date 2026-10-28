"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { friendlyErrorMessage } from "@/lib/notice-presentation";
import type { Product } from "./product-form";
type Diagnostics = { recipe_valid: boolean; photos: number; materials: number; included_products: number; is_active: boolean; is_available: boolean; is_sold_out: boolean; available_quantity: number; sellable: boolean };
export function ProductPublication({ product, onPublished, pendingChanges = false }: { product: Product; onPublished: (product: Product) => void; pendingChanges?: boolean }) {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  useEffect(() => {
    let active = true;
    void fetch(`/api/admin/products/${product.id}/publication`).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error();
      if (active) setData(result.diagnostics);
    }).catch(() => { if (active) { setMessageTone("error"); setMessage("No pudimos comprobar la configuración. Intenta actualizar la revisión."); } });
    return () => { active = false; };
  }, [product.id, attempt]);
  async function publish() {
    if (!window.confirm("¿Activar este producto y habilitar su venta? Se conservarán el precio, la receta y el indicador de agotado.")) return;
    setBusy(true); setMessage(""); setMessageTone("error");
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ is_active: true, is_available: true }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? result.error ?? "No se puede publicar todavía. Revisa los materiales o la configuración que falta.");
      onPublished(result.product); setAttempt(value => value + 1); setMessageTone("success"); setMessage("Producto actualizado. La disponibilidad de venta sigue dependiendo del inventario y del indicador de agotado.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo publicar."); }
    finally { setBusy(false); }
  }
  const state = !data ? "Comprobando configuración…" : !data.recipe_valid ? "Pendiente de configuración" : !data.is_active ? "Sin publicar" : !data.is_available || data.is_sold_out ? "Venta pausada" : !data.sellable ? "Sin existencias" : "Publicado";
  return <section className="admin-form-section space-y-4 [&_button]:min-h-11"><h3 className="text-lg font-semibold">Revisar y publicar</h3><p className="rounded-xl bg-brand-soft p-3 font-semibold">{state}</p>
    {data && <ul className="space-y-2 text-sm"><li>{data.recipe_valid ? "✓ Receta lista para preparar." : "Completa la receta de materiales antes de habilitar la venta."}</li><li>{data.photos ? `${data.photos} fotografías configuradas.` : "Falta fotografía: es recomendable añadirla, pero no impide publicar."}</li><li>Materiales: {data.materials}. Productos incluidos: {data.included_products}.</li><li>Activo: {data.is_active ? "sí" : "no"}. Venta habilitada manualmente: {data.is_available ? "sí" : "no"}. Marcado agotado: {data.is_sold_out ? "sí" : "no"}.</li><li>{data.is_active && data.is_available && !data.is_sold_out ? `Unidades disponibles para vender: ${data.available_quantity} unidades.` : "Venta pausada. Revisa las opciones anteriores para habilitarla."}</li></ul>}
    <p className="text-sm text-text-secondary">El inventario se comprueba al publicar y antes de cada venta. Esta revisión no cambia las existencias.</p>
    {message && <Notice tone={messageTone}>{messageTone === "error" ? friendlyErrorMessage(message, "No pudimos publicar el producto. Revisa su configuración e intenta nuevamente.") : message}</Notice>}
    {pendingChanges && <p className="text-sm text-text-secondary">Guarda los cambios pendientes del editor antes de publicar.</p>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => setAttempt(value => value + 1)}>Actualizar revisión</Button><Button disabled={busy || pendingChanges || !data?.recipe_valid} loading={busy} onClick={() => void publish()}>Activar y habilitar venta</Button></div>
  </section>;
}
