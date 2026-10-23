import type { Metadata } from "next";
import HomePage from "@/components/public/home/home-page";
import { StorefrontMediaProvider } from "@/components/public/storefront-media";

export const metadata: Metadata = {
  title: "Floristería Anabelle — Flores que hablan",
  description:
    "Arreglos florales, regalos y detalles diseñados para acompañar los momentos que quieres recordar.",
};

export default function Page() {
  return <StorefrontMediaProvider><HomePage year={new Date().getFullYear()} /></StorefrontMediaProvider>;
}
