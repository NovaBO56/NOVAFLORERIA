"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

type UserRole = "administrador" | "empleado";

/** Estilo de un `<select>` nativo equivalente al de Input (Design System Fase 16). */
const selectClassName =
  "h-10 w-full rounded-sm border border-border-field bg-surface px-3 text-base text-text outline-none transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

export default function CreateUserForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("empleado");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre completo">
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            maxLength={100}
          />
        </Field>

        <Field label="Correo electrónico">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="create-user-role"
            className="text-[13px] leading-[1.4] font-medium tracking-[0.02em] text-text uppercase"
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

        <Button type="submit" loading={loading} loadingText="Creando…" className="self-start">
          Crear usuario
        </Button>

        {message && (
          <p className="text-sm text-text" role="status">
            {message}
          </p>
        )}
      </form>
    </Card>
  );
}