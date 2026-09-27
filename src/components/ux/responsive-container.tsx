import type { ReactNode } from "react"
import { cn } from "cn"

type ResponsiveContainerProps = {
  children: ReactNode
  className?: string
}

export function ResponsiveContainer({
  children,
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        [
          "mx-auto w-full max-w-[1400px]",
          "px-4 py-6",
          "sm:px-6 sm:py-8",
          "lg:px-8 lg:py-10",
        ].join(" "),
        className,
      )}
    >
      {children}
    </div>
  )
}