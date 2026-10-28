import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { AuditEntries } from "@/components/admin/audit-entries";

export default async function AuditPage() {
  try { await requireAdmin(); } catch { return <AccessDenied />; }
  return <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6"><PageHeader eyebrow="Administración" title="Historial de auditoría" description="Consulta quién realizó cada operación y revisa los cambios registrados en el sistema." /><AuditEntries /></div>;
}
