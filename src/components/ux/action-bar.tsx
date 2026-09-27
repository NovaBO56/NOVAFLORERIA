import type { ReactNode } from "react"
import { cn } from "cn"

type ActionBarProps = {
  children: ReactNode
  className?: string
}

export function ActionBar({
  children,
  className,
}: ActionBarProps) {
  return (
    <div
      className={cn(
        [
          "flex flex-col gap-3",
          "rounded-xl",
          "border border-border-decorative",
          "bg-surface",
          "p-4",
          "shadow-card",
          "sm:flex-row sm:items-center sm:justify-between",
        ].join(" "),
        className,
      )}
    >
      {children}
    </div>
  )
}