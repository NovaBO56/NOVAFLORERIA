import type { ReactNode } from "react";

import { PublicShell } from "@/components/public/layout/public-shell";
import { PublicCartProvider } from "@/components/public/cart/public-cart-provider";

export default function CatalogoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PublicCartProvider>
      <PublicShell>{children}</PublicShell>
    </PublicCartProvider>
  );
}