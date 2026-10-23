"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { emptyStorefrontMedia, type StorefrontMedia } from "@/lib/public/storefront-media";
import { SafeImage } from "./safe-image";
const MediaContext = createContext<StorefrontMedia>(emptyStorefrontMedia);
export function StorefrontMediaProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState(emptyStorefrontMedia);
  useEffect(() => {
    let active = true;
    const refresh = () => { void fetch("/api/storefront-media", { cache: "no-store" }).then(response => response.json()).then(result => { if (active && result.success && result.media) setMedia(result.media); }).catch(() => { /* Keep the bundled official logo; never invent a photograph. */ }); };
    refresh(); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, []);
  return <MediaContext.Provider value={media}>{children}</MediaContext.Provider>;
}
export function useStorefrontMedia() { return useContext(MediaContext); }
/** The owner's original wordmark is bundled; optional configured media still wins. */
export function BrandLogo({ className = "h-14 max-w-[176px]" }: { className?: string }) {
  const { logo } = useStorefrontMedia();
  const [failed, setFailed] = useState<string | null>(null);
  const source = logo || "/brand/anabelle-horizontal.webp";
  const activeSource = failed === source ? "/brand/anabelle-horizontal.webp" : source;
  return <SafeImage src={activeSource} width={591} height={202} alt="Floristería Anabelle" className={`w-auto shrink-0 object-contain ${className}`} onError={() => setFailed(source)}/>;
}
export function FloralMark({ className = "size-10" }: { className?: string }) {
  const { logo } = useStorefrontMedia();
  return <SafeImage src={logo || "/brand/anabelle-monogram.webp"} width={403} height={380} alt="Monograma floral de Floristería Anabelle" className={`shrink-0 object-contain ${className}`}/>;
}
