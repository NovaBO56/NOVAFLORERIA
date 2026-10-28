"use client";
import { useEffect, useState } from "react";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { primaryProductImage } from "@/lib/product-images";

export function ProductPhoto({ id, preview = false, imageUrl, alt = "Complemento" }: { id?: string; preview?: boolean; imageUrl?: string | null; alt?: string }) {
  const [resolved, setResolved] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!id || imageUrl !== undefined) return;
    let active = true;
    void fetch("/api/admin/products/" + id + "/images").then(r => r.json()).then(r => {
      if (active && r.success) setResolved({ id, url: primaryProductImage(r.images)?.public_url ?? null });
    }).catch(() => { /* Keep the neutral replacement. */ });
    return () => { active = false; };
  }, [id, imageUrl]);
  const source = imageUrl !== undefined ? imageUrl : resolved && resolved.id === id ? resolved.url : null;
  return <ProductThumbnail src={source} alt={alt} preview
    sizes={preview ? "(max-width: 640px) 40vw, 180px" : "56px"}
    className={preview ? "mb-2 aspect-[6/5] h-auto w-full" : undefined} />;
}
