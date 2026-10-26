"use client";
import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalTitle, ModalDescription } from "@/components/ui/modal";
import { SafeImage } from "../safe-image";
import { formatMoney, pickImage } from "@/lib/public/format";
import type { PublicProduct } from "@/lib/public/types";
import { ProductDetailSection } from "./product-detail";
import { addToCart, useCart } from "./cart";
export function ComplementConfirmation({product,onClose,onCart}:{product:PublicProduct|null;onClose:()=>void;onCart:()=>void}) {
  const cart=useCart();
  const [state,setState]=useState<{id:string;products:PublicProduct[];failed:boolean}|null>(null);
  const [detail,setDetail]=useState<PublicProduct|null>(null);
  const [notice,setNotice]=useState("");
  const excludedIds=cart.items.map(line=>line.id.split(":")[0]).slice(0,50).sort().join(",");
  useEffect(()=>{
    if(!product)return;
    let active=true;
    void fetch(`/api/products/${product.id}/recommendations?exclude=${encodeURIComponent(excludedIds)}`,{cache:"no-store"}).then(r=>r.json()).then(r=>{
      if(active)setState({id:product.id,products:r.success?r.products:[],failed:!r.success});
    }).catch(()=>{if(active)setState({id:product.id,products:[],failed:true});});
    return()=>{active=false;};
  },[product,excludedIds]);
  const suggestions=state && state.id===product?.id ? state.products.filter(p=>!cart.items.some(line=>line.id.split(":")[0]===p.id)) : [];
  const photo=product?pickImage(product):null;
  function close(){setDetail(null);setNotice("");onClose();}
  return <Modal open={Boolean(product)} onOpenChange={open=>{if(!open)close();}}>
    <ModalContent voice="public" className="md:max-w-4xl">
      <ModalTitle className="pr-10">Agregaste al carrito</ModalTitle>
      <ModalDescription>Los complementos son opcionales. Ninguno se añade automáticamente.</ModalDescription>
      {product && <div className="flex min-w-0 items-center gap-3 rounded-xl bg-[#fbf2ef] p-3">
        {photo && <SafeImage src={photo.public_url} alt={photo.alt_text ?? product.name} width={56} height={56} className="size-14 rounded-lg object-cover"/>}
        <span className="min-w-0 break-words font-medium">{product.name}</span>
      </div>}
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      {detail ? <div><button type="button" className="mb-3 min-h-11 text-sm text-[#873c58] underline" onClick={()=>setDetail(null)}>Volver a complementos</button>
        <ProductDetailSection key={detail.id} embedded hideFavorite product={detail} categoryName={null} isFavorite={false} onToggleFavorite={()=>{}} onAdd={(quantity,options,message,dedications,cardQuantity)=>{
          addToCart(detail,quantity,options,message,dedications,cardQuantity);
          setNotice(`Agregaste ${detail.name}.`);setDetail(null);return true;
        }}/>
      </div> : <>
        {!state || state.id!==product?.id ? <p role="status">Consultando complementos…</p> : state.failed ? <p className="text-sm">No pudimos consultar sugerencias. Tu producto está en el carrito; puedes continuar sin complementos.</p> : suggestions.length>0 ? <div>
          <h3 className="mb-3 font-semibold">¿Quieres complementar tu regalo?</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{suggestions.slice(0,4).map(p=>{const image=pickImage(p);return <button key={p.id} type="button" className="min-w-0 rounded-xl border border-[#e6d7d8] p-3 text-left hover:bg-[#fbf2ef] focus-visible:outline-2 focus-visible:outline-[#873c58]" onClick={()=>setDetail(p)}>
            {image && <SafeImage src={image.public_url} alt={image.alt_text ?? p.name} width={180} height={150} className="mb-2 aspect-[6/5] w-full rounded-lg object-cover"/>}
            <span className="block break-words text-sm font-semibold">{p.name}</span><span className="mt-1 block text-sm">{formatMoney(p.price)}</span><span className="mt-2 block text-sm font-bold text-[#873c58]">Elegir</span>
          </button>;})}</div>
        </div> : null}
      </>}
      <div className="border-t border-[#e6d7d8] pt-4"><p aria-live="polite" className="mb-3 font-semibold">Subtotal del carrito: {formatMoney(cart.total)}</p>
        <div className="flex flex-wrap gap-2"><button type="button" className="min-h-12 rounded-xl bg-[#873c58] px-5 py-3 text-sm font-bold text-white" onClick={()=>{close();onCart();}}>Ver carrito</button>
          <button type="button" className="min-h-12 rounded-xl border px-4 text-sm" onClick={close}>Seguir comprando</button>
        </div>
      </div>
    </ModalContent>
  </Modal>;
}
