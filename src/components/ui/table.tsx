import * as React from "react"
import { cn } from "cn"

/**
 * Table — Design System Fase 16 (voz administración).
 * Fila de 44 px, encabezado suave con etiqueta en mayúsculas, cifras a la derecha
 * con `tabular-nums` (prop `numeric`). La conversión a tarjetas en móvil se resuelve
 * a nivel de página.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "sticky top-0 z-10 bg-brand-soft [&_tr]:border-b [&_tr]:border-border-decorative",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-11 border-b border-border-decorative transition-colors duration-150 hover:bg-brand-soft/50 data-[state=selected]:bg-brand-soft",
        className
      )}
      {...props}
    />
  )
}

type CellProps = {
  /** Columna numérica: alineada a la derecha y con `tabular-nums`. */
  numeric?: boolean
}

function TableHead({
  className,
  numeric = false,
  ...props
}: React.ComponentProps<"th"> & CellProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 align-middle text-[13px] leading-[1.4] font-medium tracking-[0.02em] whitespace-nowrap text-text-secondary uppercase",
        numeric ? "text-right tabular-nums" : "text-left",
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  numeric = false,
  ...props
}: React.ComponentProps<"td"> & CellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 align-middle text-text",
        numeric && "text-right tabular-nums",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-[13px] text-text-secondary", className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption }