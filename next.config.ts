import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import { visualPreviewEnabled } from "./src/lib/visual-preview/config";

const visualPreview = visualPreviewEnabled(process.env);

const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageOrigin = new URL(visualPreview ? "https://visual-preview.invalid" : storageUrl || "https://groyjvbtcuhjbltmmdfl.supabase.co");
// Opt-in for this computer's disposable lab: serve its Storage images directly
// to LAN clients without relaxing the image optimizer's private-IP protection.
const localLab = process.env.NOVA_LOCAL_LAB === "true";
if (localLab) {
  const localHosts = new Set(["127.0.0.1", "localhost", ...Object.values(networkInterfaces()).flat().filter(value => value !== undefined).map(value => value.address)]);
  if (storageOrigin.protocol !== "http:" || storageOrigin.port !== "62621" || !localHosts.has(storageOrigin.hostname)) {
    throw new Error("NOVA_LOCAL_LAB requires this computer's local Supabase on port 62621.");
  }
}
const nextConfig: NextConfig = {
  ...(visualPreview ? { distDir: ".next-visual-preview", outputFileTracingIncludes: { "/api/visual-preview": ["./.visual-preview/snapshot.json"] } } : {}),
  images: {
    unoptimized: localLab,
    remotePatterns: [
      {
        protocol: storageOrigin.protocol === "http:" ? "http" : "https",
        hostname: storageOrigin.hostname,
        port: storageOrigin.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
