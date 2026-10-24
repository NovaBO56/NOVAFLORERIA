import { ImageIcon } from "lucide-react";

/** A neutral fallback, never a substitute photograph of the product. */
export function ProductPlaceholder() {
  return <span className="product-placeholder"><ImageIcon size={28} strokeWidth={1.2} aria-hidden/><span>Imagen no disponible</span></span>;
}
