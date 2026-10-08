"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    return <Card className="h-32 animate-pulse" />;
  }

  if (error) {
    return (
      <Card className="items-center gap-2 text-center">
        <p className="text-text-secondary">{error}</p>
        <Button variant="outline" onClick={() => void loadUsers()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {users.map((user) => (
        <Card key={user.id} className="flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 break-words">
            <p className="font-semibold text-text">{user.full_name ?? "Sin nombre"}</p>
            <p className="text-text-secondary">Rol: {user.role}</p>
            <div className="mt-1">
              <Badge variant={user.is_active ? "brand" : "outline"}>
                {user.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void updateStatus(user)}>
              {user.is_active ? "Desactivar" : "Activar"}
            </Button>

            <Button size="sm" variant="outline" onClick={() => void updateRole(user)}>
              Cambiar a {user.role === "administrador" ? "empleado" : "administrador"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
