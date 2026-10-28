import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { CashPanel } from "@/components/admin/cash/cash-panel";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";

export default async function AdminCashPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow="Operación"
        title="Gestión de caja"
        description="Controla el efectivo de tu turno, registra movimientos y revisa el cierre."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/ventas">
              Registrar venta
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <CashPanel />
    </div>
  );
}
