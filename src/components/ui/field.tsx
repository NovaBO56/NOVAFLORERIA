"use client"

import * as React from "react"
import { cn } from "cn"
import { CircleAlert } from "lucide-react"
import { Label } from "radix-ui"

/**
 * Campos de formulario — NOVA FLORERÍA · C Moderno.
 *
 * Mantiene:
 * - etiquetas visibles
 * - campos obligatorios y opcionales
 * - ayuda contextual
 * - errores accesibles
 * - aria-describedby
 * - aria-invalid
 * - Input / Textarea
 */

const controlBase = [
  "w-full min-w-0",
  "rounded-xl",
  "border border-border-field",
  "bg-surface",
  "text-base text-text",
  "outline-none",
  "transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-out",
  "placeholder:text-text-secondary/70",
  "focus-visible:border-brand",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-1",
  "focus-visible:outline-brand/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger",
  "aria-invalid:focus-visible:outline-danger/30",
  "in-[.theme-public]:rounded-2xl",
  "in-[.theme-admin]:md:text-sm",
].join(" ")

function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        controlBase,
        [
          "h-11 px-3.5",
          "in-[.theme-public]:h-12",
          "in-[.theme-public]:px-4",
        ].join(" "),
        className,
      )}
      {...props}
    />
  )
}

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        controlBase,
        "min-h-28 px-3.5 py-3",
        "resize-y",
        "in-[.theme-public]:px-4",
        className,
      )}
      {...props}
    />
  )
}

type ControlProps = {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}

type FieldProps = {
  label: string

  /** Marca visualmente el campo como obligatorio. */
  required?: boolean

  /** Agrega "(opcional)" a la etiqueta. */
  optional?: boolean

  /** Texto de ayuda bajo el campo (se oculta mientras haya error). */
  hint?: string

  /** Mensaje de error: se muestra con icono y se enlaza con aria-describedby. */
  error?: string

  className?: string

  /** Un único control al que se le inyectan id y aria-*. */
  children: React.ReactElement<ControlProps>
}

function Field({
  label,
  required = false,
  optional = false,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const generatedId = React.useId()

  const controlId = children.props.id ?? generatedId

  const hintId =
    hint && !error
      ? `${controlId}-hint`
      : undefined

  const errorId =
    error
      ? `${controlId}-error`
      : undefined

  const describedBy =
    [
      children.props["aria-describedby"],
      errorId,
      hintId,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div
      data-slot="field"
      className={cn(
        "flex flex-col gap-2",
        className,
      )}
    >
      <Label.Root
        htmlFor={controlId}
        className="text-sm font-medium leading-5 text-text"
      >
        {label}

        {required && (
          <span
            className="ml-1 text-danger"
            aria-hidden="true"
          >
            *
          </span>
        )}

        {optional && (
          <span className="ml-1.5 font-normal text-text-secondary">
            (opcional)
          </span>
        )}
      </Label.Root>

      {React.cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error
          ? true
          : children.props["aria-invalid"],
      })}

      {hintId && (
        <p
          id={hintId}
          className="text-xs leading-5 text-text-secondary"
        >
          {hint}
        </p>
      )}

      {errorId && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs leading-5 text-danger"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 stroke-[1.7]"
          />
          {error}
        </p>
      )}
    </div>
  )
}

export { Field, Input, Textarea }
export type { FieldProps }