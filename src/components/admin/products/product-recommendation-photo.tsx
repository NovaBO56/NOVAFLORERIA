"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
export function ProductPhoto({ id, preview = false, imageUrl }: { id?: string; preview?: boolean; imageUrl?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id || imageUrl !== undefined) return;
    let active = true;
    void fetch(`/api/admin/products/${id}/images`).then(r => r.json()).then(r => {
      if (active && r.success) setUrl(r.images?.[0]?.public_url ?? null);
    }).catch(() => { /* Keep the neutral replacement. */ });
    return () => { active = false; };
  }, [id, imageUrl]);
  const source = imageUrl !== undefined ? imageUrl : url;
  return <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-soft ${preview ? "mb-2 aspect-[6/5] w-full" : "size-14"}`}>
    {source && failedUrl !== source ? <Image src={source} alt="" fill sizes={preview ? "(max-width: 640px) 40vw, 180px" : "56px"} className="object-cover" unoptimized onError={() => setFailedUrl(source)} /> : <Gift aria-hidden="true" className="size-6 text-brand" />}
  </div>;
}
