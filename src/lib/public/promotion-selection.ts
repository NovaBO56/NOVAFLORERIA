"use client";

import { createLocalStore } from "./local-store";

// Only an intent, never a trusted discount or a price. The server validates it.
const selection = createLocalStore<string | null>({
  key: "nova-promotion-v1", initial: null,
  sanitize: raw => raw === "" ? "" : typeof raw === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(raw) ? raw : null,
});
export const usePromotionSelection = selection.useValue;
export const getPromotionSelection = selection.get;
export function selectPromotion(id: string) { selection.update(() => id); }

/** A retry keeps its submitted choice; a fresh checkout follows the current optional intent. */
export function checkoutPromotionId(current: string | null, draft: string | undefined, pendingAttempt = false): string {
  return pendingAttempt ? draft ?? "" : current ?? draft ?? "";
}
