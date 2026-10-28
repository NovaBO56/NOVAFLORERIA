import { PageHeader } from "@/components/ui/page-header";
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader eyebrow="Administración" title="Usuarios y permisos" description="Administra el acceso del equipo, sus roles y el estado de cada cuenta." />

      <UsersPanel />
    </div>
  );
}
