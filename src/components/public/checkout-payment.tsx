"use client";
import { SafeImage as Image } from "./safe-image";
import { CheckCircle2, Download } from "lucide-react";
import { formatMoney } from "@/lib/public/format";
import type { PaymentQr, QrSlot } from "@/lib/public/payment-qrs";

export function CheckoutPayment({total,qrs,selected,error,busy,reported,whatsappAvailable,onSelect,onReport}:{
 total:number;qrs:PaymentQr[];selected:PaymentQr|null;error:string;busy:boolean;reported:boolean;
 whatsappAvailable:boolean;onSelect:(slot:QrSlot)=>void;onReport:()=>void;
}) {
 const options=reported && selected ? [selected] : qrs;
 return <section className="min-w-0 space-y-5 rounded-2xl border border-purple-200 bg-white p-5 sm:p-6" aria-label="Pago de tu pedido">
  {!reported && <div className="rounded-xl bg-[#65358e] p-5 text-white"><p className="text-sm text-white/85">Total a pagar</p><p className="mt-2 break-words text-4xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</p><p className="mt-2 text-sm text-white/85">Transfiere este importe exacto al QR seleccionado.</p></div>}
  <h2 className="text-xl font-bold">{reported?"QR utilizado en tu aviso":"Elige dónde realizarás el pago"}</h2>
  {options.length>0 ? <fieldset disabled={busy||reported} className={`grid min-w-0 gap-3 ${options.length>1?"sm:grid-cols-2":"grid-cols-1"}`}><legend className="sr-only">Cuenta para pagar</legend>{options.map(option=>{
   const checked=selected?.qr_slot===option.qr_slot;
   return <label key={option.qr_slot} className={`min-w-0 cursor-pointer rounded-xl border-2 p-3 transition-colors ${checked?"border-[#65358e] bg-purple-50":"border-purple-100 bg-white hover:border-purple-300"}`}><span className="flex min-h-10 min-w-0 items-center gap-2"><input type="radio" name="payment-qr" value={option.qr_slot} checked={checked} onChange={()=>onSelect(option.qr_slot)} className="size-4 shrink-0 accent-[#65358e]"/><span className="min-w-0 break-words font-semibold">{option.account_label}</span>{checked&&<CheckCircle2 aria-hidden className="ml-auto size-5 shrink-0 text-[#65358e]"/>}</span><Image unoptimized src={option.qr_public_url} alt={`QR de pago: ${option.account_label}`} width={220} height={220} className="mx-auto mt-3 h-auto max-w-full object-contain"/><span className="mt-2 block text-center text-xs text-[#65358e]">{checked?"Seleccionado":"Seleccionar este QR"}</span></label>;
  })}</fieldset> : <p role="status" className="rounded-xl bg-purple-50 p-4">{error||"Cargando cuentas de pago…"}</p>}
  {selected && <a href={selected.qr_public_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#65358e] underline"><Download aria-hidden size={18}/>Abrir QR seleccionado para guardarlo</a>}
  {!reported && <><div><h3 className="mb-3 font-bold">Cómo pagar</h3><ol className="space-y-2 text-sm">{["Escanea o guarda el QR seleccionado.","Realiza el pago por el total exacto.","Regresa a esta página.","Presiona “Ya pagué”."].map((text,index)=><li key={text} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-[#65358e]">{index+1}</span><span>{text}</span></li>)}</ol></div><button disabled={busy||!selected} onClick={onReport} className="min-h-12 w-full rounded-xl bg-[#65358e] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy?"Registrando aviso…":"Ya pagué"}</button><p className="text-sm text-gray-600">{whatsappAvailable?"Se abrirá WhatsApp con un mensaje preparado. Envíalo para avisarnos de tu pago.":"Registraremos tu aviso de pago. WhatsApp no está disponible; consulta el seguimiento para conocer el estado."} La tienda debe verificarlo antes de confirmar tu pedido.</p></>}
 </section>;
}
