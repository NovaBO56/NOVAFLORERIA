"use client";
import { useEffect, useState } from "react";
import { mapsDestination, type StoreLocation } from "@/validations/store-location";

export function PublicStoreLocation() {
  const [location, setLocation] = useState<StoreLocation | null>(null);
  useEffect(() => { const controller = new AbortController(); void fetch("/api/store-location", { signal: controller.signal }).then(response => response.json()).then(data => { if (data.success) setLocation(data.location); }).catch(() => {}); return () => controller.abort(); }, []);
  if (!location || (!location.address && !location.maps_url && location.latitude === null)) return null;
  const maps = mapsDestination(location);
  return <section aria-label="Ubicación de la tienda" className="mx-auto mt-6 max-w-lg space-y-3 rounded-2xl border border-purple-200 bg-white p-5 text-[#403344]">
    <h3 className="font-bold">Floristería Anabelle{location.branch_name ? ` · ${location.branch_name}` : ""}</h3>
    {location.address ? <p>{location.address}</p> : null}{location.reference ? <p className="text-sm">{location.reference}</p> : null}{location.directions ? <p>{location.directions}</p> : null}
    {maps ? <div className="flex flex-wrap justify-center gap-3"><a className="rounded-xl bg-[#65358e] px-4 py-3 font-bold text-white" href={maps} target="_blank" rel="noopener noreferrer">Cómo llegar</a><a className="rounded-xl border border-purple-200 px-4 py-3" href={maps} target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a></div> : null}
  </section>;
}
