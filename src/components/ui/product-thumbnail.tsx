"use client";

import { lazy, Suspense, useState } from "react";
import { cn } from "cn";
import { ImageIcon, Images, ZoomIn } from "lucide-react";
import { SafeImage } from "@/components/public/safe-image";
const ProductImagePreview = lazy(() => import("./product-image-preview"));

export type ProductThumbnailProps = {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  sizes?: string;
  fit?: "contain" | "cover";
  priority?: boolean;
  preview?: boolean;
  kind?: "product" | "category";
  voice?: "admin" | "public";
};

/** One bounded image/fallback for catalogue, order lines and dense tables. */
export function ProductThumbnail({
  src, alt, size = "md", className, sizes, fit = "cover",
  priority = false, preview = false, kind = "product", voice = "admin",
}: ProductThumbnailProps) {
  const [open, setOpen] = useState(false);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const Icon = kind === "category" ? Images : ImageIcon;
  const fallback = <span role="img" aria-label={alt + ": imagen no disponible"} className="absolute inset-0 flex items-center justify-center bg-brand-soft text-brand/65"><Icon className="h-[38%] max-h-12 w-[38%] max-w-12" strokeWidth={1.4} aria-hidden /></span>;
  const image = src ? <SafeImage src={src} alt={alt} fill sizes={sizes ?? (size === "sm" ? "40px" : size === "lg" ? "80px" : "56px")} priority={priority} className={fit === "contain" ? "object-contain" : "object-cover"} fallback={fallback} onError={() => {setFailedSource(src); setOpen(false);}} /> : fallback;
  const frame = cn("relative inline-flex shrink-0 overflow-hidden rounded-xl border border-border-decorative bg-brand-soft align-middle", size === "sm" ? "size-10" : size === "lg" ? "size-20" : "size-14", className);
  if (!preview || !src || failedSource === src) return <span data-slot="product-thumbnail" className={frame}>{image}</span>;
  return <>
    <button type="button" data-slot="product-thumbnail" className={cn(frame, "group cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand")} onClick={() => setOpen(true)} aria-label={"Ampliar imagen de " + alt} aria-haspopup="dialog">
      {image}<span aria-hidden className="absolute bottom-0 right-0 grid size-5 place-items-center rounded-tl-md bg-white/90 text-brand"><ZoomIn size={12}/></span>
    </button>
    {open && <Suspense fallback={<span role="status" className="sr-only">Abriendo imagen…</span>}><ProductImagePreview src={src} alt={alt} voice={voice} onOpenChange={setOpen}/></Suspense>}
  </>;
}
