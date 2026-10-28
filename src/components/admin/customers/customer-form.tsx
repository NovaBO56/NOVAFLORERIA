"use client";

import { useRef, useState } from "react";
import { Save, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
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
    <Modal open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <ModalContent dismissible={!saving} showCloseButton={false} className="gap-0 p-0 md:max-w-2xl">
        <div
          className="flex items-start justify-between gap-3 border-b border-border-decorative bg-slate-50 p-5 sm:p-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <UserRound aria-hidden="true" className="size-5" />
            </div>
            <div>
              <ModalTitle className="text-lg font-semibold">
                {editing ? "Editar cliente" : "Nuevo cliente"}
              </ModalTitle>
              <ModalDescription className="mt-1 text-sm">
                {
                  editing ? "Actualiza los datos de contacto del cliente." : "Registra sus datos para identificarlo en futuras compras."
                }
              </ModalDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar cliente" disabled={saving} onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <form onSubmit={submit}>
          <fieldset disabled={saving}>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" required className="sm:col-span-2">
                  <Input
                    required
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Nombre completo"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Teléfono" optional>
                  <Input
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="WhatsApp" optional>
                  <Input value={whatsapp} onChange={event => setWhatsapp(event.target.value)} inputMode="tel" />
                </Field>
                <Field label="Correo" optional>
                  <Input
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    inputMode="email"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Cumpleaños" optional>
                  <Input type="date" value={birthday} onChange={event => setBirthday(event.target.value)} />
                </Field>
              </div>
              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-decorative bg-slate-50 p-4"
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={event => setIsActive(event.target.checked)}
                  className="mt-0.5 size-4 accent-violet-600"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Cliente activo
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">
                    Estado del cliente dentro del directorio.
                  </span>
                </span>
              </label>
              {
                error && <div role="alert" className="admin-notice text-sm" data-tone="danger">
                  {error}
                </div>
              }
            </div>
            <div className="admin-form-actions sticky bottom-0 border-t border-border-decorative bg-slate-50 p-4">
              <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving} loadingText="Guardando…" disabled={!name.trim()}>
                <Save aria-hidden="true" />{editing ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </div>
          </fieldset>
        </form>
      </ModalContent>
    </Modal>
  );
}
