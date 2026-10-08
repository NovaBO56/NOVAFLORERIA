"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Only route changes replay the fade; filters and form edits keep their state. */
export function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="nova-page min-w-0">{children}</div>;
}
