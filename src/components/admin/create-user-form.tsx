
"use client";

import { useState } from "react";

type UserRole = "administrador" | "empleado";

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Nombre completo
        </label>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          maxLength={100}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Rol
        </label>
        <select
          value={role}
          onChange={(event) =>
            setRole(event.target.value as UserRole)
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="empleado">Empleado</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md border px-4 py-2"
      >
        {loading ? "Creando..." : "Crear usuario"}
      </button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  );
}

