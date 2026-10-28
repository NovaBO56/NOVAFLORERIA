"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/modal";
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
  const [confirmation, setConfirmation] = useState<{user: User; action: "status" | "role"} | null>(null);
  const [pending, setPending] = useState(false);

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

  return <>
    {!users.length ? <EmptyState title="No hay usuarios para mostrar" /> : <Table>
      <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
      <TableBody>{users.map(user => <TableRow key={user.id}>
        <TableCell className="font-semibold">{user.full_name ?? "Sin nombre"}</TableCell>
        <TableCell><Badge variant="outline">{user.role === "administrador" ? "Administrador" : "Empleado"}</Badge></TableCell>
        <TableCell><Badge variant={user.is_active ? "brand" : "outline"}>{user.is_active ? "Activo" : "Inactivo"}</Badge></TableCell>
        <TableCell><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setConfirmation({user, action: "status"})}>{user.is_active ? "Desactivar" : "Activar"}</Button><Button size="sm" variant="ghost" onClick={() => setConfirmation({user, action: "role"})}>Cambiar a {user.role === "administrador" ? "empleado" : "administrador"}</Button></div></TableCell>
      </TableRow>)}</TableBody>
    </Table>}
    <Modal open={Boolean(confirmation)} onOpenChange={open => { if (!open && !pending) setConfirmation(null); }}>
      <ModalContent dismissible={!pending}>
        <ModalHeader><ModalTitle>{confirmation?.action === "role" ? "Cambiar rol de acceso" : confirmation?.user.is_active ? "Desactivar usuario" : "Activar usuario"}</ModalTitle><ModalDescription>{confirmation?.action === "role" ? "El cambio modifica las operaciones que esta persona puede realizar en el sistema." : confirmation?.user.is_active ? "Esta persona dejará de tener acceso al administrador hasta que vuelvas a activarla." : "Esta persona podrá volver a ingresar con los permisos de su rol."}</ModalDescription></ModalHeader>
        {confirmation && <div className="rounded-xl border border-border-decorative bg-bg-admin p-4 text-sm"><p className="font-semibold">{confirmation.user.full_name ?? "Sin nombre"}</p><p className="mt-1 text-text-secondary">{confirmation.action === "role" ? "Nuevo rol: " + (confirmation.user.role === "administrador" ? "Empleado" : "Administrador") : "Rol actual: " + (confirmation.user.role === "administrador" ? "Administrador" : "Empleado")}</p></div>}
        <ModalFooter><Button variant="outline" disabled={pending} onClick={() => setConfirmation(null)}>Cancelar</Button><Button loading={pending} variant={confirmation?.action === "status" && confirmation.user.is_active ? "destructive" : "default"} onClick={async () => { if (!confirmation || pending) return; setPending(true); try { if (confirmation.action === "status") await updateStatus(confirmation.user); else await updateRole(confirmation.user); setConfirmation(null); } catch { setError("No se pudo conectar con el servidor."); setConfirmation(null); } finally { setPending(false); } }}>Confirmar cambio</Button></ModalFooter>
      </ModalContent>
    </Modal>
  </>;
}
