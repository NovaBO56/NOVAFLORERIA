import type { NextConfig } from "next";

const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageOrigin = new URL(storageUrl || "https://groyjvbtcuhjbltmmdfl.supabase.co");
const nextConfig: NextConfig = {
  images: {
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
