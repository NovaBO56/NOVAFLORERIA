import { requireAdmin } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { AuditEntries } from "@/components/admin/audit-entries";

export default async function AuditPage() {
  try { await requireAdmin(); } catch { return <AccessDenied />; }
  return <div className="flex flex-col gap-4"><h1>Auditoría</h1><AuditEntries /></div>;
}
