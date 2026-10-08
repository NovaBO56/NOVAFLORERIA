import sharp from "sharp";
import { paymentQrExtension } from "./payment-qr-file";

export async function optimizeProductImage(bytes: Buffer, mime: string) {
  if (!paymentQrExtension(mime, bytes)) throw new Error("La imagen no coincide con su formato o supera 5 MB.");
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning", animated: false });
  const meta = await image.metadata();
  if (!meta.width || !meta.height || (meta.pages ?? 1) > 1) throw new Error("Selecciona una imagen estática válida.");
  return image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
}
