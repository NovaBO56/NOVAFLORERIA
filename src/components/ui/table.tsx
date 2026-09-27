import * as React from "react"
import { cn } from "cn"

/**
 * Table — NOVA FLORERÍA · C Moderno.
 *
 * Mantiene la API del Design System Fase 16:
 * - `numeric` para columnas numéricas.
 * - `TableCaption`.
 * - scroll horizontal en espacios reducidos.
 *
 * Visual:
 * - separadores horizontales suaves
 * - sin líneas verticales
 * - encabezado limpio
 * - filas espaciosas
 * - hover discreto
 * - cifras con `tabular-nums`
 *
 * La adaptación a tarjetas en móvil se resuelve a nivel de página.
 */

function Table({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse text-left text-sm",
          className,
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        [
          "bg-brand-soft/60",
          "[&_tr]:border-b",
          "[&_tr]:border-border-decorative",
        ].join(" "),
        className,
      )}
      {...props}
    />
  )
}

function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        [
          "h-12",
          "border-b border-border-decorative",
          "transition-colors duration-150 ease-out",
          "hover:bg-brand-soft/35",
          "data-[state=selected]:bg-brand-soft",
        ].join(" "),
        className,
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
        [
          "h-11",
          "px-4",
          "align-middle",
          "text-xs",
          "leading-5",
          "font-semibold",
          "tracking-[0.04em]",
          "whitespace-nowrap",
          "text-text-secondary",
          "uppercase",
        ].join(" "),
        numeric
          ? "text-right tabular-nums"
          : "text-left",
        className,
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
        [
          "px-4",
          "py-3",
          "align-middle",
          "text-sm",
          "text-text",
        ].join(" "),
        numeric && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-3 text-xs leading-5 text-text-secondary",
        className,
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}