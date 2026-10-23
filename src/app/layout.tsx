import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Floristería Anabelle",
  description: "Sistema de gestión para Floristería Anabelle",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, interactiveWidget: "resizes-content", viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {process.env.NOVA_VISUAL_PREVIEW === "true" && <aside role="note" className="bg-[#4c285f] px-4 py-3 text-center text-sm text-white">Vista previa visual · Datos sintéticos · No se registran pedidos ni pagos · NO PAGAR</aside>}
        {children}
      </body>
    </html>
  );
}
