import { ArrowUpRight, Clock, MapPin, Navigation } from "lucide-react";
import { locationMapLinks } from "@/lib/public/location-map";
import type { StoreLocation } from "@/validations/store-location";

export function LocationCard({ location, hours, loading = false, unavailable = false }: { location: StoreLocation | null; hours: string | null; loading?: boolean; unavailable?: boolean }) {
  const { directions, preview } = locationMapLinks(location);
  const configured = Boolean(location?.address || directions || preview);
  const title = loading ? "Consultando ubicación…" : unavailable ? "Ubicación no disponible" : configured ? "Encuéntranos" : "Ubicación por configurar";
  return <section aria-label="Ubicación de Floristería Anabelle" aria-busy={loading} className="mx-auto mt-10 min-w-0 overflow-hidden rounded-[32px] border border-[#e4d8e8] bg-white p-5 text-left text-[#403344] shadow-[0_12px_40px_-26px_rgba(76,40,95,0.3)] sm:p-7">
    <div className="grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.35fr)]">
      <div className="min-w-0 px-1 py-2 sm:px-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#f4edf7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#79578c]"><MapPin size={12} aria-hidden />Visítanos</span>
        <h3 className="mt-4 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">Floristería Anabelle{location?.branch_name ? <span className="mt-1 block text-sm font-normal text-[#746579]">{location.branch_name}</span> : null}</h3>
        <p className="mt-2 text-sm font-medium text-[#785c87]" role={loading ? "status" : undefined}>{title}</p>
        <div className="mt-5 space-y-4 text-sm leading-6 [overflow-wrap:anywhere]">
          {location?.address && <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7b90]">Dirección</p><address className="mt-1 not-italic">{location.address}</address></div>}
          {location?.reference && <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7b90]">Referencia</p><p className="mt-1">{location.reference}</p></div>}
          {location?.directions && <p className="text-xs text-[#746579]">{location.directions}</p>}
          {hours && <div className="flex items-start gap-2 text-xs text-[#746579]"><Clock className="mt-0.5 shrink-0" size={15} aria-hidden /><p>Horario de hoy: <span className="font-medium text-[#4e3c58]">{hours}</span></p></div>}
          {!configured && !loading && <p className="text-xs leading-6 text-[#82738b]">{unavailable ? "No pudimos consultar la ubicación en este momento." : "La dirección y el mapa aparecerán aquí cuando estén configurados."}</p>}
        </div>
        {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#65358e] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(101,53,142,.15)] transition-colors hover:bg-[#572d7a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#65358e]"><Navigation size={16} aria-hidden />Cómo llegar<ArrowUpRight size={14} aria-hidden /></a>}
      </div>
      <div className="min-w-0 overflow-hidden rounded-[26px] border border-[#ede5f0] bg-[#f6f1f8] shadow-[0_6px_22px_-15px_rgba(76,40,95,.2)]">
        <div className="relative aspect-[16/9] min-h-[210px] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_right,#f6e3ee,transparent_65%)] lg:aspect-auto lg:h-[300px]">
          {preview ? <iframe title="Mapa de la ubicación configurada de Floristería Anabelle en Google Maps" src={preview} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="absolute inset-0 block h-full w-full border-0" /> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"><span className="grid size-16 place-items-center rounded-full border border-white bg-white/70 text-[#a184b0] shadow-sm"><MapPin size={27} strokeWidth={1.4} aria-hidden /></span><p className="text-sm font-medium text-[#795c87]">{loading ? "Preparando ubicación…" : configured ? "Consulta la ubicación en Google Maps" : "Ubicación por configurar"}</p><p className="max-w-64 text-xs leading-5 text-[#93829d]">{configured ? "Abre el enlace para ver el mapa y planificar tu visita." : "Un espacio para encontrarnos, cuando la ubicación esté disponible."}</p></div>}
        </div>
        {preview && <div className="flex min-w-0 items-center gap-2 border-t border-[#ede5f0] bg-white px-4 py-3 text-[11px] text-[#7b6985]"><MapPin size={13} className="shrink-0" aria-hidden /><span className="min-w-0 break-words [overflow-wrap:anywhere]">{location?.branch_name || "Floristería Anabelle"} · Google Maps</span></div>}
      </div>
    </div>
  </section>;
}
