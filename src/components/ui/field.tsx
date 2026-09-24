"use client"

import * as React from "react"
import { cn } from "cn"
import { CircleAlert } from "lucide-react"
import { Label } from "radix-ui"

/**
 * Campos de formulario — Design System Fase 16.
 * Etiqueta siempre visible encima, ayuda, error con icono + texto y "(opcional)".
 */
const controlBase =
  "w-full min-w-0 rounded-sm border border-border-field bg-surface text-base text-text outline-none transition-colors duration-150 placeholder:text-text-secondary focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger in-[.theme-admin]:md:text-sm"

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        controlBase,
        "h-10 px-3 in-[.theme-public]:h-12",
        className
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlBase, "min-h-24 px-3 py-3", className)}
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
  /** Agrega "(opcional)" a la etiqueta. */
  optional?: boolean
  /** Texto de ayuda bajo el campo (se oculta mientras haya error). */
  hint?: string
  /** Mensaje de error: se muestra con icono y se enlaza con aria-describedby. */
  error?: string
  className?: string
  /** Un único control (Input, Textarea, select…) al que se le inyectan id y aria-*. */
  children: React.ReactElement<ControlProps>
}

function Field({ label, optional = false, hint, error, className, children }: FieldProps) {
  const generatedId = React.useId()
  const controlId = children.props.id ?? generatedId
  const hintId = hint && !error ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy =
    [children.props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") ||
    undefined

  return (
    <div data-slot="field" className={cn("flex flex-col gap-1.5", className)}>
      <Label.Root
        htmlFor={controlId}
        className="text-[13px] leading-[1.4] font-medium tracking-[0.02em] text-text uppercase"
      >
        {label}
        {optional && (
          <span className="ml-1 font-normal tracking-normal text-text-secondary normal-case">
            (opcional)
          </span>
        )}
      </Label.Root>
      {React.cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })}
      {hintId && (
        <p id={hintId} className="text-[13px] leading-[1.4] text-text-secondary">
          {hint}
        </p>
      )}
      {errorId && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-[13px] leading-[1.4] text-danger"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-px size-4 shrink-0 stroke-[1.5]"
          />
          {error}
        </p>
      )}
    </div>
  )
}

export { Field, Input, Textarea }
export type { FieldProps }