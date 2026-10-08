import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  Check,
  CheckCheck,
  Clock,
  Flower2,
  Package,
  TriangleAlert,
  X,
} from "lucide-react"

/**
 * Badge — NOVA FLORERÍA · C Moderno.
 *
 * Insignias compactas, suaves y redondeadas.
 * El color nunca comunica por sí solo: siempre se acompaña
 * de texto y, cuando corresponde, de un icono.
 */
const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center gap-1.5",
    "rounded-full",
    "border border-transparent",
    "px-2.5 py-1",
    "text-xs leading-none font-medium",
    "whitespace-nowrap",
    "transition-colors duration-200 ease-out",
    "[&_svg]:size-3.5",
    "[&_svg]:shrink-0",
    "[&_svg]:stroke-[1.7]",
  ].join(" "),
  {
    variants: {
      variant: {
        brand: "bg-brand-soft text-brand",

        outline:
          "border-border-decorative bg-surface text-text-secondary",
      },
    },

    defaultVariants: {
      variant: "brand",
    },
  },
)

/**
 * Estados de pedido.
 *
 * Los colores son suaves para mantener el lenguaje C Moderno.
 * Cada estado conserva texto + icono para no depender únicamente
 * del color como señal.
 */
const ORDER_STATUS = {
  pendiente_pago: {
    label: "Pendiente de pago",
    Icon: Clock,
    className: "bg-[#FBF3D9] text-[#9A7800]",
  },

  confirmado: {
    label: "Confirmado",
    Icon: Check,
    className: "bg-[#E4EFFA] text-[#245F96]",
  },

  en_preparacion: {
    label: "En preparación",
    Icon: Flower2,
    className: "bg-brand-soft text-brand",
  },

  listo: {
    label: "Listo",
    Icon: Package,
    className: "bg-[#E5F0E8] text-[#3F6B4F]",
  },

  finalizado: {
    label: "Finalizado",
    Icon: CheckCheck,
    className: "bg-[#EFEDF2] text-[#554E5E]",
  },

  cancelado: {
    label: "Cancelado",
    Icon: X,
    className: "bg-[#F4E9E7] text-[#8A5F59]",
  },

  rechazado: {
    label: "Pago rechazado",
    Icon: TriangleAlert,
    className: "bg-[#FBE6E3] text-danger",
  },
} as const

type OrderStatus = keyof typeof ORDER_STATUS

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Estado de pedido: agrega automáticamente icono, etiqueta y colores. */
    status?: OrderStatus
  }

function Badge({
  className,
  variant,
  status,
  children,
  ...props
}: BadgeProps) {
  if (status) {
    const { label, Icon, className: statusClass } =
      ORDER_STATUS[status]

    return (
      <span
        key={status}
        data-slot="badge"
        data-status={status}
        className={cn(
          badgeVariants({ variant: null }),
          statusClass,
          "nova-fade",
          className,
        )}
        {...props}
      >
        <Icon aria-hidden="true" />
        {children ?? label}
      </span>
    )
  }

  return (
    <span
      data-slot="badge"
      className={cn(
        badgeVariants({ variant }),
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge, badgeVariants, ORDER_STATUS }
export type { BadgeProps, OrderStatus }
