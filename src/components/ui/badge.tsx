import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Check, CheckCheck, Clock, Flower2, Package, TriangleAlert, X } from "lucide-react"

/**
 * Badge — Design System Fase 16.
 * Insignia con icono + texto + color (el color nunca comunica solo). radius-sm.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-[13px] leading-[1.4] font-medium whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.5]",
  {
    variants: {
      variant: {
        brand: "bg-brand-soft text-brand",
        outline: "border border-border-decorative bg-surface text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "brand",
    },
  }
)

/**
 * Estados de pedido — colores e iconos de Fase 16 · Paso 2 §2.
 * Los fondos suaves no tienen token con nombre en el Design System, por eso
 * se usan los valores aprobados tal cual.
 */
const ORDER_STATUS = {
  pendiente_pago: {
    label: "Pendiente de pago",
    Icon: Clock,
    className: "bg-[#FBF3D9] text-[#B98900]",
  },
  confirmado: {
    label: "Confirmado",
    Icon: Check,
    className: "bg-[#DCEAFA] text-[#1D5FA8]",
  },
  en_preparacion: {
    label: "En preparación",
    Icon: Flower2,
    className: "bg-brand-soft text-brand",
  },
  listo: {
    label: "Listo",
    Icon: Package,
    className: "bg-[#E1EEE5] text-leaf",
  },
  finalizado: {
    label: "Finalizado",
    Icon: CheckCheck,
    className: "bg-[#EDEAF0] text-[#4B4555]",
  },
  cancelado: {
    label: "Cancelado",
    Icon: X,
    className: "bg-[#F1E6E4] text-[#8A6A66]",
  },
  rechazado: {
    label: "Pago rechazado",
    Icon: TriangleAlert,
    className: "bg-[#FBE4E1] text-danger",
  },
} as const

type OrderStatus = keyof typeof ORDER_STATUS

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Estado de pedido: agrega automáticamente icono, etiqueta y colores. */
    status?: OrderStatus
  }

function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  if (status) {
    const { label, Icon, className: statusClass } = ORDER_STATUS[status]
    return (
      <span
        data-slot="badge"
        data-status={status}
        className={cn(badgeVariants({ variant: null }), statusClass, className)}
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
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge, badgeVariants, ORDER_STATUS }
export type { BadgeProps, OrderStatus }