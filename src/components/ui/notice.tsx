import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "cn";

export type NoticeTone = "info" | "success" | "warning" | "error";
export type NoticeProps = {
  children: ReactNode;
  tone?: NoticeTone;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  announce?: boolean;
};

const tones = {
  info: { Icon: Info, style: "border-brand/20 bg-brand-soft/60 text-text" },
  success: { Icon: CheckCircle2, style: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  warning: { Icon: TriangleAlert, style: "border-amber-200 bg-amber-50 text-amber-950" },
  error: { Icon: CircleAlert, style: "border-rose-200 bg-rose-50 text-rose-950" },
};

/** Shared feedback for shop and admin; essential messages remain until dismissed. */
export function Notice({ children, tone = "info", title, onDismiss, className, announce = true }: NoticeProps) {
  const { Icon, style } = tones[tone];
  return <div data-slot="notice" data-tone={tone}
    role={announce ? tone === "error" ? "alert" : "status" : undefined}
    aria-atomic={announce ? true : undefined}
    className={cn("flex min-w-0 items-start gap-3 rounded-xl border p-4 text-sm leading-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200", style, className)}>
    <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
    <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
    {onDismiss && <button type="button" onClick={onDismiss} className="-my-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" aria-label="Cerrar aviso"><X size={18} aria-hidden /></button>}
  </div>;
}
