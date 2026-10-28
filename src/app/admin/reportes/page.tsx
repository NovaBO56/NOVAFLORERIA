import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { ReportsPanel } from "@/components/admin/reports/reports-panel";

export default async function AdminReportsPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader eyebrow="Gestión" title="Reportes" description="Consulta ventas, caja, existencias y actividad. Descarga el reporte que necesitas." />

      <ReportsPanel />
    </div>
  );
}