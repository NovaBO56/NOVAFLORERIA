import { requireAdmin } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { UsersPanel } from "@/components/admin/users-panel";

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

      <UsersPanel />
    </div>
  );
}
