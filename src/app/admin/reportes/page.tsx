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
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1>Reportes</h1>
        <p className="text-text-secondary">
          Ventas, caja, inventario, mermas, cancelaciones, clientes y productos más vendidos.
        </p>
      </div>

      <ReportsPanel />
    </div>
  );
}