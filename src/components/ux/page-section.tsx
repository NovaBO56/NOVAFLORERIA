import type { ReactNode } from "react"
import { cn } from "cn"

type PageSectionProps = {
  children: ReactNode
  className?: string
}

export function PageSection({
  children,
  className,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "space-y-5",
        "sm:space-y-6",
        className,
      )}
    >
      {children}
    </section>
  )
}