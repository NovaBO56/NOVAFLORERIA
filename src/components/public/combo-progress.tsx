"use client";
import { pickImage } from "@/lib/public/format";
import type { PublicProduct } from "@/lib/public/types";
import { SafeImage } from "./safe-image";
import { X } from "lucide-react";

export function ComboProgress({ step, total, product, quantity, name, onCancel }: { step: number; total: number; product: PublicProduct; quantity: number; name?: string; onCancel: () => void }) {
  const image = pickImage(product);
  return <section aria-label="Armado de tu combo" className="mb-6 min-w-0 rounded-2xl border border-[#dfd1e7] bg-[#f6f0f8] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-[#604581]"><p>{name ?? "Tu combo"}</p><p role="status">Paso {step} de {total}</p></div>
    <div role="progressbar" aria-label="Progreso del combo" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-valuetext={`Paso ${step} de ${total}`} className="my-3 h-1.5 overflow-hidden rounded-full bg-[#e5d7ec]"><div className="h-full w-full origin-left rounded-full bg-[#82609d]" style={{ transform: `scaleX(${step / total})` }}/></div>
    <div className="flex min-w-0 items-center gap-3">
      {image && <SafeImage src={image.public_url} alt={image.alt_text ?? product.name} width={64} height={72} className="h-18 w-16 shrink-0 rounded-xl object-cover"/>}
      <div className="min-w-0 [overflow-wrap:anywhere]"><h3 className="font-bold text-[#4c285f]">{product.name}</h3><p className="mt-1 text-sm text-[#6a5a74]">{quantity} {quantity === 1 ? "unidad" : "unidades"} · Elige los detalles para este producto.</p></div>
    </div>
    <p className="mt-3 text-sm leading-6 text-[#6a5a74]">{step < total ? "Continúa para elegir los detalles del siguiente producto." : "Revisa este último producto y agrega tu combo al carrito."} Las opciones extra se cobran aparte.</p>
    <button type="button" className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cebbdb] bg-white px-4 py-2 text-sm font-bold text-[#604581] hover:bg-[#eee5f4] focus-visible:outline-2" onClick={onCancel}><X size={16} aria-hidden/>Cancelar armado del combo</button>
  </section>;
}
