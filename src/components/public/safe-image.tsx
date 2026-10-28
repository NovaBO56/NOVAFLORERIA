"use client";
import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

export function SafeImage({ fallback, ...props }: ImageProps & { fallback?: ReactNode }) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null);
  let allowed = true;
  if (typeof props.src === "string" && !props.src.startsWith("/")) {
    try { const url = new URL(props.src); const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://groyjvbtcuhjbltmmdfl.supabase.co"); allowed = url.origin === origin.origin && url.pathname.startsWith("/storage/v1/object/public/"); } catch { allowed = false; }
  }
  if (!allowed || failedSource === props.src) return fallback !== undefined ? fallback : <span role="img" aria-label={`${props.alt || "Imagen"}: no disponible`} className={`flex min-h-24 items-center justify-center rounded-xl bg-[#fbf2ef] p-4 text-sm text-[#645460] ${props.fill ? "absolute inset-0" : ""}`}>Imagen no disponible</span>;
  return <Image {...props} alt={props.alt} unoptimized={props.unoptimized || (typeof props.src === "string" && props.src.startsWith("http://127.0.0.1:"))} onError={event => { setFailedSource(props.src); props.onError?.(event); }} />;
}
