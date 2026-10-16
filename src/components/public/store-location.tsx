"use client";
import { useEffect, useState } from "react";
import { mapsDestination, storeLocationSchema, type StoreLocation } from "@/validations/store-location";
import { LocationCard } from "./location-card";

export function PublicStoreLocation({ hours = null, compact = false }: { hours?: string | null; compact?: boolean }) {
  const [location, setLocation] = useState<StoreLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/store-location", { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success) throw Error("Location unavailable");
      const parsed = storeLocationSchema.safeParse(data.location);
      if (!controller.signal.aborted) setLocation(parsed.success ? parsed.data : null);
    }).catch(() => { if (!controller.signal.aborted) setUnavailable(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  if (compact) { const directions = location ? mapsDestination(location) : null; return <div className="customer-note"><strong>{location?.branch_name || "Floristería Anabelle"}</strong><p>{loading ? "Consultando ubicación…" : unavailable ? "No pudimos consultar la ubicación. Coordina el recojo con la tienda." : location?.address || "Ubicación por configurar. Consulta con la tienda dónde recoger tu pedido."}</p>{location?.reference && <p>{location.reference}</p>}{hours && <p className="mt-2">Horario de hoy: {hours}</p>}{directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center font-bold underline">Cómo llegar</a>}</div>; }
  return <LocationCard location={location} hours={hours} loading={loading} unavailable={unavailable} />;
}
