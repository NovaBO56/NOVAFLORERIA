import { z } from "zod";
import { clearCheckoutSession } from "./checkout";

export const previousPurchaseKey = "nova-previous-purchase-v1";
const purchaseSchema = z.object({ id: z.string().uuid(), phone: z.string().regex(/^\d{8}$/), number: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
export type PreviousPurchase = z.infer<typeof purchaseSchema>;

// Session-only recovery, just like the current checkout. Never store receipt tokens.
export function readPreviousPurchase(storage: Pick<Storage, "getItem">): PreviousPurchase | null {
  try { const parsed = purchaseSchema.safeParse(JSON.parse(storage.getItem(previousPurchaseKey) || "null")); return parsed.success ? parsed.data : null; } catch { return null; }
}

export function beginAnotherPurchase(storage: Pick<Storage, "setItem" | "removeItem">, previous: PreviousPurchase) {
  // Preserve the old lookup before clearing the current draft and idempotency attempt.
  const parsed = purchaseSchema.safeParse(previous);
  if (!parsed.success) return false;
  try { storage.setItem(previousPurchaseKey, JSON.stringify(parsed.data)); } catch { return false; }
  clearCheckoutSession(storage);
  return true;
}
