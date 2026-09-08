import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";
import UserManagement from "@/components/admin/user-management";
import CreateUserForm from "@/components/admin/create-user-form";
import SystemSettings from "@/components/admin/system-settings";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de usuarios</h1>
          <p className="mt-2 text-muted-foreground">
            Administración de usuarios, roles y estados.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Crear usuario</h2>
          <CreateUserForm />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Usuarios registrados
          </h2>
          <UserManagement />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Configuración crítica
          </h2>
          <SystemSettings />
        </section>
      </div>
    </main>
  );
}