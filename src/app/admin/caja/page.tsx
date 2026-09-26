import { AccessDenied } from "@/components/admin/layout/access-denied";
import { CashPanel } from "@/components/admin/cash/cash-panel";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";

export default async function AdminCashPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1>Caja</h1>
        <p className="text-text-secondary">Abre la caja, registra movimientos y ciérrala al final del turno.</p>
      </div>
      <CashPanel />
    </div>
  );
}