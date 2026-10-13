import { mapsDestination, storeLocationSchema } from "@/validations/store-location";

/** Only configured public business data; no geocoding, keys or guessed position. */
export function locationMapLinks(value: unknown) {
  const parsed = storeLocationSchema.safeParse(value);
  if (!parsed.success) return { directions: null, preview: null };
  const location = parsed.data;
  let directions = mapsDestination(location);
  if (!directions && location.address) {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1"); url.searchParams.set("destination", location.address);
    directions = url.href;
  }
  // A shared short URL is a destination link, not an embeddable document.
  // Coordinates take precedence for the preview; otherwise use an explicit
  // public Maps embed or the exact configured address, without resolving links.
  const query = location.latitude !== null && location.longitude !== null
    ? `${location.latitude},${location.longitude}` : location.address;
  if (location.maps_url) {
    const embed = new URL(location.maps_url);
    if (!query && embed.hostname === "www.google.com" && embed.pathname === "/maps/embed" && embed.searchParams.has("pb")) {
      const safe = new URL("https://www.google.com/maps/embed");
      safe.searchParams.set("pb", embed.searchParams.get("pb")!);
      return { directions, preview: safe.href };
    }
  }
  if (!query) return { directions, preview: null };
  const preview = new URL("https://maps.google.com/maps");
  preview.searchParams.set("q", query); preview.searchParams.set("z", "16"); preview.searchParams.set("output", "embed");
  return { directions, preview: preview.href };
}
