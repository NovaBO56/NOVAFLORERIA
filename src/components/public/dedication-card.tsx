"use client";
import { useId } from "react";
import { Flower2 } from "lucide-react";
import type { Dedication } from "@/lib/public/dedications";
import { resizeDedications } from "@/lib/public/dedications";

export function DedicationPreview({ entries, compact = false }: { entries?: Dedication[]; compact?: boolean }) {
  if (!entries?.length) return null;
  if (compact) return <details className="mt-3 min-w-0 rounded-xl border border-[#dfd1ea] bg-[#f6f0fa] p-3 text-[#873c58]"><summary className="min-h-11 cursor-pointer text-sm font-bold">{entries.length === 1 ? "Revisar mi tarjeta" : `Revisar mis ${entries.length} tarjetas`}</summary><div className="mt-2"><DedicationPreview entries={entries}/></div></details>;
  return <div className="space-y-3 min-w-0">{entries.map((entry, index) => <div key={index} className="rounded-2xl border border-[#dfd1ea] bg-[#f6f0fa] p-4 text-[#873c58]" aria-label={`Tarjeta ${index + 1}`}>
    <p className="mb-2 flex items-center gap-2 text-xs font-bold"><Flower2 size={16} className="text-[#a14370]" aria-hidden/>Tarjeta {index + 1}</p>
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6">{entry.message || "Sin mensaje escrito."}</p>
    {entry.signature && <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-right text-sm italic">{entry.signature}</p>}
    {!entry.message && !entry.signature && <p className="mt-2 text-xs">Sin dedicatoria escrita; la tarjeta se incluye en blanco.</p>}
  </div>)}</div>;
}

export function DedicationEditor({ count, value, onChange }: { count: number; value: Dedication[]; onChange: (entries: Dedication[]) => void }) {
  const id = useId();
  if (!count) return null;
  if (count > 198) return <section aria-label="Una dedicatoria especial" className="rounded-2xl border border-[#dfd1ea] bg-[#faf7fc] p-4 text-sm text-[#873c58]"><h3 className="font-bold">Una dedicatoria especial</h3><p className="mt-2">Tu selección incluye {count} tarjetas. Para escribir mensajes, elige una cantidad menor: hasta 198 tarjetas por línea. Puedes continuar con tarjetas en blanco.</p>{value.length > 0 && <button type="button" className="mt-2 min-h-11 underline" onClick={() => onChange([])}>Quitar los mensajes de esta selección</button>}</section>;
  const entries = resizeDedications(value, count);
  return <section className="min-w-0 space-y-4 rounded-2xl border border-[#dfd1ea] bg-[#faf7fc] p-4" aria-label="Personaliza tu tarjeta">
    <div><h3 className="font-bold text-[#873c58]">Personaliza tu tarjeta</h3><p className="mt-1 text-xs leading-5 text-[#6b5965]">{count === 1 ? "Tu detalle incluye una tarjeta." : `Incluye ${count} tarjetas independientes.`} También puedes dejarla en blanco; la tarjeta sigue incluida y el precio no cambia.</p></div>
    {entries.map((entry, index) => { const mode = entry.intent ?? (entry.message || entry.signature ? "write" : "blank"); const change = (next: Dedication) => onChange(entries.map((item, position) => position === index ? next : item)); return <fieldset key={index} className="min-w-0 space-y-3"><legend className="text-sm font-bold text-[#873c58]">Tarjeta {index + 1}</legend>
      <div className="grid gap-2 sm:grid-cols-2">{[{ value: "write", label: "Escribir una dedicatoria" }, { value: "blank", label: "Dejar la tarjeta en blanco" }].map(choice => <label key={choice.value} className="nova-option flex min-h-11 items-center gap-2 rounded-xl border border-[#dfd1ea] p-3 text-sm text-[#873c58]"><input type="radio" name={`${id}-${index}-intent`} checked={mode === choice.value} onChange={() => change(choice.value === "blank" ? { message: "", signature: "", intent: "blank" } : { ...entry, intent: "write" })}/>{choice.label}</label>)}</div>
      {mode === "write" ? <div className="nova-dedication space-y-2" key="write"><label className="block text-sm" htmlFor={`${id}-${index}-message`}>Mensaje de la tarjeta</label>
      <textarea id={`${id}-${index}-message`} required maxLength={250} rows={3} value={entry.message} onChange={event => change({ ...entry, intent: "write", message: event.target.value })} className="w-full rounded-xl border border-[#d9bfc6] bg-white p-3 text-sm focus-visible:outline-[#873c58]" aria-invalid={!entry.message.trim()} aria-describedby={`${id}-${index}-count ${id}-${index}-help`}/>
      <p id={`${id}-${index}-count`} className="text-right text-xs text-[#6b5965]">{entry.message.length}/250</p>
      <p id={`${id}-${index}-help`} className="text-xs text-[#6b5965]">{entry.message.trim() ? "Este mensaje se escribirá en la tarjeta física." : "Escribe un mensaje o selecciona tarjeta en blanco para continuar."}</p>
      <label className="block text-sm" htmlFor={`${id}-${index}-signature`}>Firma (opcional)</label>
      <input id={`${id}-${index}-signature`} maxLength={60} value={entry.signature} onChange={event => change({ ...entry, signature: event.target.value })} className="min-h-11 w-full rounded-xl border border-[#d9bfc6] bg-white p-3 text-sm focus-visible:outline-[#873c58]"/>
      <p className="text-right text-xs text-[#6b5965]">{entry.signature.length}/60</p>
      </div> : <p key="blank" className="nova-dedication text-sm text-[#6b5965]">Se incluye la tarjeta física en blanco.</p>}
    </fieldset>; })}
    <p className="text-xs font-bold text-[#873c58]">Vista previa de tus tarjetas</p><DedicationPreview entries={entries}/>
  </section>;
}
