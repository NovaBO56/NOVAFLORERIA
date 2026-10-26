import sharp from "sharp";

export const AVATAR_BUCKET = "profile-avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class AvatarInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readAvatarBody(request: Request) {
  if (!AVATAR_TYPES.includes(request.headers.get("content-type")?.split(";")[0] ?? "")) {
    throw new AvatarInputError("Selecciona una imagen JPG, PNG o WebP.", 415);
  }
  if (Number(request.headers.get("content-length")) > MAX_AVATAR_BYTES) throw new AvatarInputError("La foto debe pesar como máximo 2 MB.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AvatarInputError("Selecciona una foto.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AVATAR_BYTES) { await reader.cancel(); throw new AvatarInputError("La foto debe pesar como máximo 2 MB.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function normalizeAvatar(input: Buffer) {
  if (!input.length || input.length > MAX_AVATAR_BYTES) throw new AvatarInputError("La foto debe pesar entre 1 byte y 2 MB.", 413);
  try {
    const options = { limitInputPixels: 16000000, failOn: "error" as const };
    const meta = await sharp(input, options).metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format) || (meta.pages ?? 1) > 1) throw Error();
    // Decode and re-encode: strip EXIF/location metadata and reject disguised files.
    return await sharp(input, options).rotate().resize(256, 256, { fit: "cover", position: "centre" }).webp({ quality: 85 }).toBuffer();
  } catch { throw new AvatarInputError("No se pudo leer la imagen. Usa un JPG, PNG o WebP estático de hasta 16 megapíxeles."); }
}
