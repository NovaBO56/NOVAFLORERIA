"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Field, Input } from "@/components/ui/field";

type UserRole = "administrador" | "empleado";

/** Estilo de un `<select>` nativo equivalente al de Input (Design System Fase 16). */
const selectClassName =
  "h-11 w-full rounded-xl border border-border-field bg-surface px-3 text-sm text-text outline-none transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

export default function CreateUserForm({ onCreated }: { onCreated?: () => void }) {
  const lock = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("empleado");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "No se pudo crear el usuario.");
        return;
      }

      setMessage("Usuario creado correctamente.");
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("empleado");
      onCreated?.();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
      lock.current = false;
    }
  }

  return (
    <SectionCard title="Crear usuario" description="Añade una cuenta para el equipo y define su rol de acceso.">
      <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
        <fieldset disabled={loading} className="flex min-w-0 flex-col gap-4">
        <Field label="Nombre completo" required>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            maxLength={100}
          />
        </Field>

        <Field label="Correo electrónico" required>
          <Input
            type="email" autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Contraseña" required hint="Al menos 8 caracteres.">
          <Input
            type="password" autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="create-user-role"
            className="text-sm font-medium text-text"
          >
            Rol
          </label>
          <select
            id="create-user-role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className={selectClassName}
          >
            <option value="empleado">Empleado</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        <p className="rounded-lg bg-bg-admin p-3 text-xs leading-5 text-text-secondary">El administrador puede gestionar usuarios y configuración. El empleado conserva las operaciones permitidas por su rol.</p>
        <Button type="submit" loading={loading} loadingText="Creando…" className="self-start">
          Crear usuario
        </Button>
        </fieldset>

        {message && (
          <p className="text-sm text-text" role="status">
            {message}
          </p>
        )}
      </form>
    </SectionCard>
  );
}
