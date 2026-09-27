import * as React from "react"
import { cn } from "cn"

/**
 * Card — NOVA FLORERÍA · C Moderno.
 *
 * Mantiene la API del Design System Fase 16.
 * - Admin: limpia, profesional y compacta.
 * - Público: más espaciosa y orgánica.
 * - interactive: elevación y transición sutil.
 */
type CardProps = React.ComponentProps<"div"> & {
  /** Tarjeta clicable: cursor y elevación suave al pasar el cursor. */
  interactive?: boolean
}

function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        [
          "flex flex-col gap-4",
          "rounded-xl",
          "border border-border-decorative",
          "bg-surface",
          "p-5",
          "text-text",
          "shadow-card",
          "transition-all duration-200 ease-out",
          "in-[.theme-public]:gap-6",
          "in-[.theme-public]:rounded-2xl",
          "in-[.theme-public]:p-6",
        ].join(" "),
        interactive &&
          [
            "cursor-pointer",
            "hover:-translate-y-0.5",
            "hover:shadow-card-hover",
            "active:translate-y-0",
          ].join(" "),
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        [
          "text-xl leading-tight font-semibold text-text",
          "in-[.theme-public]:font-display",
          "in-[.theme-public]:font-medium",
        ].join(" "),
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-sm leading-6 text-text-secondary",
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 pt-1", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}

export type { CardProps }