import { AccessDenied } from "@/components/admin/layout/access-denied";
import { DashboardPanel } from "@/components/admin/dashboard-panel";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";

export default async function AdminDashboardPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-text-secondary">Un vistazo rápido a lo que necesita tu atención hoy.</p>
      </div>
      <DashboardPanel />
    </div>
  );
}