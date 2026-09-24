import * as React from "react"
import { cn } from "cn"

/**
 * Card — Design System Fase 16.
 * Admin: borde visible + sombra muy sutil, padding space-4, radius-sm.
 * Público (dentro de `.theme-public`): padding space-6, radius-lg.
 */
type CardProps = React.ComponentProps<"div"> & {
  /** Tarjeta clicable: cursor y sombra `shadow-card-hover` al pasar el cursor. */
  interactive?: boolean
}

function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-4 rounded-sm border border-border-decorative bg-surface p-4 text-text shadow-card in-[.theme-public]:gap-6 in-[.theme-public]:rounded-lg in-[.theme-public]:p-6",
        interactive &&
          "cursor-pointer transition-shadow duration-150 ease-out hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "text-xl leading-tight font-semibold text-text in-[.theme-public]:font-display in-[.theme-public]:font-medium",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-text-secondary", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
export type { CardProps }