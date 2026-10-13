"use client";
import { useEffect, useState } from "react";
import { storeLocationSchema, type StoreLocation } from "@/validations/store-location";
import { LocationCard } from "./location-card";

export function PublicStoreLocation({ hours = null }: { hours?: string | null }) {
  const [location, setLocation] = useState<StoreLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/store-location", { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success) throw Error("Location unavailable");
      const parsed = storeLocationSchema.safeParse(data.location);
      if (!controller.signal.aborted) setLocation(parsed.success ? parsed.data : null);
    }).catch(() => { if (!controller.signal.aborted) setUnavailable(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <LocationCard location={location} hours={hours} loading={loading} unavailable={unavailable} />;
}
