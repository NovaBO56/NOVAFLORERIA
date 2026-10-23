"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
type Choice = {id:string;name:string;is_active:boolean;is_available:boolean;is_sold_out:boolean};
export function ProductRecommendations({productId}:{productId:string}) {
  const [selected,setSelected]=useState<string[]>([]);
  const [choices,setChoices]=useState<Choice[]>([]);
  const [search,setSearch]=useState("");
  const [busy,setBusy]=useState(false);
  const [ready,setReady]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    let active=true;
    void fetch(`/api/admin/products/${productId}/recommendations`).then(r=>r.json()).then(r=>{
      if(!active)return;
      if(!r.success)throw new Error();
      setSelected(r.product_ids);setReady(true);
    }).catch(()=>{if(active)setMessage("No pudimos cargar la configuración. Cierra y vuelve a abrir para reintentar.");});
    return()=>{active=false;};
  },[productId]);
  useEffect(()=>{
    let active=true;
    const timer=setTimeout(()=>{
      void fetch(`/api/admin/products?limit=100&is_active=true${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}`).then(r=>r.json()).then(r=>{
        if(active && r.success)setChoices(previous=>[...new Map([...previous,...r.products].map(p=>[p.id,p])).values()]);
      }).catch(()=>{if(active)setMessage("No pudimos buscar productos. Intenta nuevamente.");});
    },250);
    return()=>{active=false;clearTimeout(timer);};
  },[search]);
  async function save(){
    setBusy(true);setMessage("");
    try {
      const response=await fetch(`/api/admin/products/${productId}/recommendations`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({product_ids:selected})});
      const result=await response.json();
      setMessage(result.success?"Complementos guardados.":result.message ?? "No se pudo guardar.");
    }catch{setMessage("No se pudo guardar. Tu selección se conserva para reintentar.");}
    finally{setBusy(false);}
  }
  return <div className="space-y-4">
    <h3 className="font-semibold">Complementos recomendados</h3>
    <p className="text-sm text-text-secondary">Hasta cuatro productos opcionales, sin descuento automático. Cada uno conserva su receta e inventario. No se permiten ciclos entre recomendaciones.</p>
    <ol className="space-y-2">{selected.map((id,index)=><li key={id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
      <span className="min-w-0 flex-1 break-words">{choices.find(p=>p.id===id)?.name ?? "Producto configurado (puede estar inactivo)"}</span>
      <Button variant="outline" size="sm" disabled={index===0 || busy} aria-label={`Subir complemento ${index+1}`} onClick={()=>setSelected(list=>{const next=[...list];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})}>Subir</Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={()=>setSelected(list=>list.filter(p=>p!==id))}>Quitar</Button>
    </li>)}</ol>
    <Input aria-label="Buscar complementos comerciales" placeholder="Buscar un producto comercial" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="max-h-64 space-y-1 overflow-y-auto">{choices.filter(p=>p.id!==productId && p.is_active && p.is_available && !p.is_sold_out && !selected.includes(p.id) && p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(p=><button key={p.id} type="button" disabled={!ready || selected.length>=4 || busy} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-soft disabled:opacity-40" onClick={()=>setSelected(list=>[...list,p.id])}>{p.name}</button>)}</div>
    {message && <p role="status" className="text-sm">{message}</p>}
    <Button disabled={!ready} loading={busy} onClick={()=>void save()}>Guardar complementos</Button>
  </div>;
}
