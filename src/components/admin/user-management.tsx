"use client";

import { useEffect, useState } from "react";

type UserRole = "administrador" | "empleado";

type User = {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users");

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? "No se pudieron cargar los usuarios.",
        );
      }

      setUsers(result.users ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  const timeoutId = setTimeout(() => {
    void loadUsers();
  }, 0);

  return () => clearTimeout(timeoutId);
}, []);

  async function updateStatus(user: User) {
    const response = await fetch(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: !user.is_active,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.message ?? "No se pudo actualizar el estado.");
      return;
    }

    await loadUsers();
  }

  async function updateRole(user: User) {
    const newRole: UserRole =
      user.role === "administrador" ? "empleado" : "administrador";

    const response = await fetch(`/api/admin/users/${user.id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: newRole,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.message ?? "No se pudo actualizar el rol.");
      return;
    }

    await loadUsers();
  }

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm">{error}</p>
        <button
          onClick={loadUsers}
          className="mt-3 rounded-md border px-4 py-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-semibold">
              {user.full_name ?? "Sin nombre"}
            </p>

            <p className="text-sm text-muted-foreground">
              Rol: {user.role}
            </p>

            <p className="text-sm text-muted-foreground">
              Estado: {user.is_active ? "Activo" : "Inactivo"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(user)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {user.is_active ? "Desactivar" : "Activar"}
            </button>

            <button
              onClick={() => updateRole(user)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              Cambiar a{" "}
              {user.role === "administrador" ? "empleado" : "administrador"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}