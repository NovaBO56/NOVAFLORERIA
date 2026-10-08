"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalTitle, ModalDescription } from "@/components/ui/modal";

import type { Customer } from "./customer-management";

type Props = {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
};

export default function CustomerForm({
  customer,
  onClose,
  onSaved,
}: Props) {
  const editing = Boolean(customer);
  const lock = useRef(false);

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(
    customer?.whatsapp ?? "",
  );
  const [email, setEmail] = useState(customer?.email ?? "");
  const [birthday, setBirthday] = useState(
    customer?.birthday ?? "",
  );
  const [isActive, setIsActive] = useState(
    customer?.is_active ?? true,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;

    try {
      setSaving(true);
      setError("");

      const endpoint = editing
        ? `/api/admin/customers/${customer!.id}`
        : "/api/admin/customers";

      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          birthday: birthday || null,
          is_active: isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "No se pudo guardar el cliente.",
        );
      }

      onSaved(data.customer);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
      lock.current = false;
    }
  }

  return (
    <Modal open onOpenChange={open => { if (!open && !saving) onClose(); }}><ModalContent dismissible={!saving} showCloseButton={false} className="gap-0 p-0 md:max-w-2xl">
      <>
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <ModalTitle className="text-lg font-semibold">
              {editing
                ? "Editar cliente"
                : "Nuevo cliente"}
            </ModalTitle>

            <ModalDescription className="mt-1 text-sm text-muted-foreground">
              {editing
                ? "Actualiza los datos del cliente."
                : "Registra un nuevo cliente."}
            </ModalDescription>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar cliente"
            disabled={saving}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={submit}><fieldset disabled={saving}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Nombre *
              </span>

              <input
                required
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Teléfono
              </span>

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                WhatsApp
              </span>

              <input
                value={whatsapp}
                onChange={(event) =>
                  setWhatsapp(event.target.value)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Correo
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Cumpleaños
              </span>

              <input
                type="date"
                value={birthday}
                onChange={(event) =>
                  setBirthday(event.target.value)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="flex items-center gap-3 pt-7">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium">
                Cliente activo
              </span>
            </label>
          </div>

          {error && (
            <div role="alert" className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={saving || !name.trim()}
            >
              {saving
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </Button>
          </div>
        </fieldset></form>
      </>
    </ModalContent></Modal>
  );
}
