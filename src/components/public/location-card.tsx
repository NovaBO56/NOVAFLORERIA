"use client";
import { useState } from "react";
import { ArrowUpRight, Clock, MapPin, Navigation } from "lucide-react";
import { locationMapLinks } from "@/lib/public/location-map";
import type { StoreLocation } from "@/validations/store-location";
import type { WeekDay } from "@/lib/public/types";
import { WeeklyHours } from "./weekly-hours";

function MapPreview({ preview, directions, name }: { preview: string; directions: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="public-map-card min-w-0 overflow-hidden rounded-[26px] border border-[#eadcdd] bg-[#f8efed]">
    <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-auto lg:h-[300px]">
      {!failed ? <iframe title={`Mapa de ${name} en Google Maps`} src={preview} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onError={() => setFailed(true)} className="absolute inset-0 block h-full w-full border-0"/> : <div className="public-map-placeholder absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center"><MapPin size={28} strokeWidth={1.4} aria-hidden/><p className="text-sm font-semibold">No pudimos mostrar el mapa</p><button type="button" className="min-h-11 rounded-full border border-[#d9bfc6] bg-white px-5 text-sm font-semibold text-[#873c58]" onClick={() => setFailed(false)}>Volver a intentar</button></div>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 text-xs text-[#645460]"><span>Google Maps · {name}</span>{directions && <a className="inline-flex min-h-11 items-center gap-1 font-semibold text-[#873c58] underline underline-offset-4" href={directions} target="_blank" rel="noopener noreferrer">Abrir en Google Maps<ArrowUpRight size={14} aria-hidden/></a>}</div>
  </div>;
}

export function LocationCard({ location, hours, week = [], loading = false, unavailable = false }: { location: StoreLocation | null; hours: string | null; week?: WeekDay[]; loading?: boolean; unavailable?: boolean }) {
  const { directions, preview } = locationMapLinks(location);
  const configured = Boolean(location?.address || directions || preview);
  const title = loading ? "Consultando ubicación…" : unavailable ? "Ubicación no disponible" : configured ? "Encuéntranos" : "Ubicación por configurar";
  return <section aria-label="Ubicación de Floristería Anabelle" aria-busy={loading} className="mx-auto mt-14 min-w-0 overflow-hidden rounded-[32px] border border-[#eadcdd] bg-white p-5 text-left text-[#392b38] shadow-[0_12px_40px_-26px_rgba(76,40,95,0.3)] sm:p-7">
    <div className="grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.35fr)]">
      <div className="min-w-0 px-1 py-2 sm:px-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f8efed] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#873c58]"><MapPin size={12} aria-hidden />Visítanos</span>
        <h3 className="mt-4 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">{location?.branch_name || "Floristería Anabelle"}</h3>
        <p className="mt-2 text-sm font-medium text-[#873c58]" role={loading ? "status" : undefined}>{title}</p>
        <div className="mt-5 space-y-4 text-sm leading-6 [overflow-wrap:anywhere]">
          {location?.address && <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#6b5965]">Dirección</p><address className="mt-1 not-italic">{location.address}</address></div>}
          {location?.reference && <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#6b5965]">Referencia</p><p className="mt-1">{location.reference}</p></div>}
          {location?.directions && <p className="text-xs text-[#6b5965]">{location.directions}</p>}
          {hours && <div className="flex items-start gap-2 text-xs text-[#6b5965]"><Clock className="mt-0.5 shrink-0" size={15} aria-hidden /><p>Horario de hoy: <span className="font-medium text-[#4e3c58]">{hours}</span></p></div>}
          {!location?.address && !loading && configured && <p className="text-xs leading-6 text-[#6b5965]">Dirección por configurar. Consulta el enlace de Google Maps para llegar.</p>}
          {!configured && !loading && <p className="text-xs leading-6 text-[#6b5965]">{unavailable ? "No pudimos consultar la ubicación en este momento." : "La dirección y el mapa aparecerán aquí cuando estén configurados."}</p>}
        </div>
        <WeeklyHours week={week} />
        {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#873c58] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(101,53,142,.15)] transition-colors hover:bg-[#713048] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58]"><Navigation size={16} aria-hidden />Cómo llegar<ArrowUpRight size={14} aria-hidden /></a>}
      </div>
      {preview ? <MapPreview key={preview} preview={preview} directions={directions} name={location?.branch_name || "Floristería Anabelle"}/> : <div className="min-w-0 overflow-hidden rounded-[26px] border border-[#ede5f0] bg-[#f8efed] shadow-[0_6px_22px_-15px_rgba(76,40,95,.2)]">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_right,#f6e3ee,transparent_65%)] sm:aspect-[2/1] lg:aspect-auto lg:h-[320px]">
          <div className="public-map-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 py-3 text-center sm:gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-white bg-white/70 text-[#873c58] shadow-sm sm:size-14"><MapPin size={23} strokeWidth={1.4} aria-hidden /></span><p className="text-sm font-medium text-[#873c58]">{loading ? "Preparando ubicación…" : unavailable ? "Mapa no disponible" : configured ? "Consulta la ubicación en Google Maps" : "Ubicación por configurar"}</p><p className="max-w-64 text-xs leading-5 text-[#6b5965]">{configured ? "Abre el enlace para ver el mapa y planificar tu visita." : "La dirección y el mapa estarán aquí cuando la tienda los configure."}</p></div>
        </div>
      </div>}
    </div>
  </section>;
}
