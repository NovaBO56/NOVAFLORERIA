import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { SalesPanel } from "@/components/admin/sales/sales-panel";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";

export default async function AdminSalesPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow="Operación"
        title="Ventas en tienda"
        description="Selecciona los productos, revisa el importe y registra el cobro de una venta presencial."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/caja">
              Ver caja
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <SalesPanel />
    </div>
  );
}
