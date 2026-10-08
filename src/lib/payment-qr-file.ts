const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export function paymentQrExtension(type: string, bytes: Uint8Array): string | null {
  const extension = TYPES[type];
  if (!extension || bytes.length === 0 || bytes.length > 5 * 1024 * 1024) return null;
  const starts = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (type === "image/png" && starts([137, 80, 78, 71, 13, 10, 26, 10])) return extension;
  if (type === "image/jpeg" && starts([255, 216, 255])) return extension;
  if (type === "image/webp" && starts([82, 73, 70, 70]) && [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value)) return extension;
  return null;
}
