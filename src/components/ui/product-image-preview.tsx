"use client";

import { SafeImage } from "@/components/public/safe-image";
import { Modal, ModalContent, ModalDescription, ModalTitle } from "./modal";

/** Loaded only when somebody requests the larger photograph. */
export default function ProductImagePreview({ src, alt, voice, onOpenChange }: {
  src: string; alt: string; voice: "admin" | "public"; onOpenChange: (open: boolean) => void;
}) {
  return <Modal open onOpenChange={onOpenChange}>
    <ModalContent voice={voice} className="md:max-w-2xl">
      <ModalTitle className="pr-9">Imagen de {alt}</ModalTitle>
      <ModalDescription>Vista ampliada de la imagen disponible.</ModalDescription>
      <span className="relative block aspect-square max-h-[65dvh] w-full overflow-hidden rounded-xl bg-brand-soft">
        <SafeImage src={src} alt={alt} fill sizes="(min-width: 768px) 640px, 100vw" className="object-contain"/>
      </span>
    </ModalContent>
  </Modal>;
}
