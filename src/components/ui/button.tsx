import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { LoaderCircle } from "lucide-react"
import { Slot } from "radix-ui"

/**
 * Button — NOVA FLORERÍA · C Moderno
 *
 * Mantiene la funcionalidad del Design System Fase 16:
 * - variantes
 * - tamaños
 * - asChild
 * - loading
 * - loadingText
 *
 * La apariencia se adapta automáticamente entre:
 * - Dashboard administrativo
 * - Tienda pública
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-xl border border-transparent",
    "text-sm font-medium whitespace-nowrap",
    "transition-all duration-200 ease-out",
    "outline-none select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-brand",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-busy:cursor-progress",
    "active:scale-[0.98]",
    "in-[.theme-public]:rounded-2xl",
    "in-[.theme-public]:text-base",
    "[&_svg]:pointer-events-none",
    "[&_svg]:shrink-0",
    "[&_svg]:stroke-[1.7]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-brand text-white",
          "shadow-sm",
          "hover:bg-brand-hover hover:shadow-card",
        ].join(" "),

        secondary: [
          "bg-brand-soft text-brand",
          "hover:bg-[color-mix(in_srgb,var(--brand-soft),var(--brand)_8%)]",
        ].join(" "),

        outline: [
          "border-border-decorative bg-surface text-text",
          "hover:border-brand/30 hover:bg-brand-soft hover:text-brand",
        ].join(" "),

        ghost: [
          "text-text",
          "hover:bg-brand-soft hover:text-brand",
        ].join(" "),

        destructive: [
          "bg-danger text-white",
          "shadow-sm",
          "hover:bg-[color-mix(in_srgb,var(--danger),black_10%)]",
        ].join(" "),

        link: [
          "h-auto px-0 text-brand",
          "underline-offset-4",
          "hover:underline",
        ].join(" "),
      },

      size: {
        default: [
          "h-10 px-4",
          "in-[.theme-public]:h-12",
          "in-[.theme-public]:px-6",
          "[&_svg:not([class*='size-'])]:size-4.5",
          "in-[.theme-public]:[&_svg:not([class*='size-'])]:size-5",
        ].join(" "),

        sm: [
          "h-9 px-3",
          "in-[.theme-public]:h-11",
          "in-[.theme-public]:px-5",
          "[&_svg:not([class*='size-'])]:size-4",
        ].join(" "),

        lg: [
          "h-11 px-5",
          "in-[.theme-public]:h-[3.25rem]",
          "in-[.theme-public]:px-8",
          "[&_svg:not([class*='size-'])]:size-5",
          "in-[.theme-public]:[&_svg:not([class*='size-'])]:size-5.5",
        ].join(" "),

        icon: [
          "size-10",
          "in-[.theme-public]:size-11",
          "[&_svg:not([class*='size-'])]:size-5",
        ].join(" "),

        "icon-sm": [
          "size-9",
          "in-[.theme-public]:size-11",
          "[&_svg:not([class*='size-'])]:size-4",
        ].join(" "),

        "icon-lg": [
          "size-11",
          "in-[.theme-public]:size-12",
          "[&_svg:not([class*='size-'])]:size-5",
          "in-[.theme-public]:[&_svg:not([class*='size-'])]:size-6",
        ].join(" "),
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean

    /** Muestra el estado "procesando": deshabilita el botón y evita el doble envío. */
    loading?: boolean

    /** Texto mostrado mientras `loading` es verdadero. */
    loadingText?: string
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingText = "Procesando…",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  const isLoading = loading && !asChild

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }