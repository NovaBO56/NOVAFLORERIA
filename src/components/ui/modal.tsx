"use client"

import * as React from "react"
import { cn } from "cn"
import { X } from "lucide-react"
import { Dialog } from "radix-ui"

/**
 * Modal — Design System Fase 16.
 * Móvil: hoja inferior. Escritorio (md+): diálogo centrado. Sombra `shadow-overlay`.
 * El contenido se monta en un portal (fuera de `.theme-*`), por eso la voz se pasa
 * con la prop `voice` y la clase de tema se aplica al propio contenido.
 */
const Modal = Dialog.Root
const ModalTrigger = Dialog.Trigger
const ModalClose = Dialog.Close

type ModalContentProps = React.ComponentProps<typeof Dialog.Content> & {
  /** Voz visual del contenido. Por defecto: administración. */
  voice?: "admin" | "public"
  /** Si es false, ni Esc ni el clic fuera lo cierran (acciones destructivas o en proceso). */
  dismissible?: boolean
  /** Muestra el botón de cerrar (X) en la esquina. */
  showCloseButton?: boolean
}

function ModalContent({
  className,
  children,
  voice = "admin",
  dismissible = true,
  showCloseButton = true,
  ...props
}: ModalContentProps) {
  const isPublic = voice === "public"

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        data-slot="modal-overlay"
        className="fixed inset-0 z-50 bg-[#1E1826]/40 duration-200 motion-reduce:animate-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <Dialog.Content
        data-slot="modal-content"
        onInteractOutside={dismissible ? undefined : (event) => event.preventDefault()}
        onEscapeKeyDown={dismissible ? undefined : (event) => event.preventDefault()}
        className={cn(
          isPublic ? "theme-public" : "theme-admin",
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] w-full flex-col gap-4 overflow-y-auto border border-border-decorative bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-text shadow-overlay outline-none duration-200 motion-reduce:animate-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8",
          "rounded-t-lg md:inset-auto md:top-1/2 md:left-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95",
          isPublic ? "md:rounded-lg md:p-6" : "md:rounded-sm",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Dialog.Close
            data-slot="modal-close"
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-sm text-text-secondary transition-colors duration-150 outline-none hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <X aria-hidden="true" className="size-5 stroke-[1.5]" />
            <span className="sr-only">Cerrar</span>
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-header"
      className={cn("flex flex-col gap-1 pr-10", className)}
      {...props}
    />
  )
}

function ModalTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      data-slot="modal-title"
      className={cn(
        "text-xl leading-tight font-semibold text-text in-[.theme-public]:font-display in-[.theme-public]:font-medium",
        className
      )}
      {...props}
    />
  )
}

function ModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      data-slot="modal-description"
      className={cn("text-text-secondary", className)}
      {...props}
    />
  )
}

/** En móvil los botones se apilan con la acción principal arriba; en md+ van a la derecha. */
function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "flex flex-col-reverse gap-2 md:flex-row md:justify-end",
        className
      )}
      {...props}
    />
  )
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
}
export type { ModalContentProps }