"use client";
import { useId } from "react";
import { Flower2 } from "lucide-react";
import type { Dedication } from "@/lib/public/dedications";
import { resizeDedications } from "@/lib/public/dedications";

export function DedicationPreview({ entries }: { entries?: Dedication[] }) {
  if (!entries?.length) return null;
  return <div className="space-y-3 min-w-0">{entries.map((entry, index) => <div key={index} className="rounded-2xl border border-[#dfd1ea] bg-[#f6f0fa] p-4 text-[#604581]" aria-label={`Tarjeta ${index + 1}`}>
    <p className="mb-2 flex items-center gap-2 text-xs font-bold"><Flower2 size={16} aria-hidden/>Tarjeta {index + 1}</p>
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6">{entry.message || "Sin mensaje escrito."}</p>
    {entry.signature && <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-right text-sm italic">{entry.signature}</p>}
    {!entry.message && !entry.signature && <p className="mt-2 text-xs">Sin dedicatoria escrita; la tarjeta se incluye en blanco.</p>}
  </div>)}</div>;
}

export function DedicationEditor({ count, value, onChange }: { count: number; value: Dedication[]; onChange: (entries: Dedication[]) => void }) {
  const id = useId();
  if (!count) return null;
  if (count > 198) return <section aria-label="Una dedicatoria especial" className="rounded-2xl border border-[#dfd1ea] bg-[#faf7fc] p-4 text-sm text-[#604581]"><h3 className="font-bold">Una dedicatoria especial</h3><p className="mt-2">Tu selección incluye {count} tarjetas. Para escribir mensajes, elige una cantidad menor: hasta 198 tarjetas por línea. Puedes continuar con tarjetas en blanco.</p>{value.length > 0 && <button type="button" className="mt-2 min-h-11 underline" onClick={() => onChange([])}>Quitar los mensajes de esta selección</button>}</section>;
  const entries = resizeDedications(value, count);
  return <section className="min-w-0 space-y-4 rounded-2xl border border-[#dfd1ea] bg-[#faf7fc] p-4" aria-label="Una dedicatoria especial">
    <div><h3 className="font-bold text-[#604581]">Una dedicatoria especial</h3><p className="mt-1 text-xs leading-5 text-[#6c6278]">{count === 1 ? "Tu detalle incluye una tarjeta sin costo adicional." : `Incluye ${count} tarjetas. Escribe cada una por separado; las que dejes vacías se entregan en blanco.`}</p></div>
    {entries.map((entry, index) => <fieldset key={index} className="min-w-0 space-y-2"><legend className="text-sm font-bold text-[#604581]">Tarjeta {index + 1}</legend>
      <label className="block text-sm" htmlFor={`${id}-${index}-message`}>Mensaje (opcional)</label>
      <textarea id={`${id}-${index}-message`} maxLength={250} rows={3} value={entry.message} onChange={event => onChange(entries.map((item, position) => position === index ? { ...item, message: event.target.value } : item))} className="w-full rounded-xl border border-[#d8cadd] bg-white p-3 text-sm focus-visible:outline-[#74599f]" aria-describedby={`${id}-${index}-count`}/>
      <p id={`${id}-${index}-count`} className="text-right text-xs text-[#6c6278]">{entry.message.length}/250</p>
      <label className="block text-sm" htmlFor={`${id}-${index}-signature`}>Firma (opcional)</label>
      <input id={`${id}-${index}-signature`} maxLength={60} value={entry.signature} onChange={event => onChange(entries.map((item, position) => position === index ? { ...item, signature: event.target.value } : item))} className="min-h-11 w-full rounded-xl border border-[#d8cadd] bg-white p-3 text-sm focus-visible:outline-[#74599f]"/>
      <p className="text-right text-xs text-[#6c6278]">{entry.signature.length}/60</p>
    </fieldset>)}
    <p className="text-xs font-bold text-[#604581]">Vista previa de tus tarjetas</p><DedicationPreview entries={entries}/>
  </section>;
}
