import { requireAdmin } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import CreateUserForm from "@/components/admin/create-user-form";
import SystemSettings from "@/components/admin/system-settings";
import UserManagement from "@/components/admin/user-management";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1>Gestión de usuarios</h1>
        <p className="text-text-secondary">Administración de usuarios, roles y estados.</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2>Crear usuario</h2>
        <CreateUserForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2>Usuarios registrados</h2>
        <UserManagement />
      </section>

      <section className="flex flex-col gap-4">
        <h2>Configuración crítica</h2>
        <SystemSettings />
      </section>
    </div>
  );
}