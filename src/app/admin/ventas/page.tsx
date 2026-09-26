import { AccessDenied } from "@/components/admin/layout/access-denied";
import { SalesPanel } from "@/components/admin/sales/sales-panel";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";

export default async function AdminSalesPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1>Ventas físicas</h1>
        <p className="text-text-secondary">Registra una venta hecha en el local.</p>
      </div>
      <SalesPanel />
    </div>
  );
}