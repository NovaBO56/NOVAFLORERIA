import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export function ShoppingNotice({ children, tone = "info", onDismiss }: { children: ReactNode; tone?: "info" | "success" | "error"; onDismiss?: () => void }) {
  const Icon = tone === "error" ? CircleAlert : tone === "success" ? CheckCircle2 : Info;
  return <div role={tone === "error" ? "alert" : "status"} className={`flex min-w-0 items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${tone === "error" ? "border-[#d8b8ca] bg-[#fbf1f7] text-[#793451]" : "border-[#e6d7d8] bg-[#fbf2ef] text-[#645460]"}`}>
    <Icon aria-hidden className="mt-1 shrink-0" size={19}/>
    <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</div>
    {onDismiss && <button type="button" onClick={onDismiss} className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-white/70 focus-visible:outline-2" aria-label="Cerrar aviso"><X size={17} aria-hidden/></button>}
  </div>;
}
