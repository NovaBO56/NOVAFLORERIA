import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { OrdersPanel } from "@/components/admin/orders/orders-panel";
import { getCurrentUserProfile, requireEmployeeOrAdmin } from "@/lib/auth/permissions";

type PageProps = {
  searchParams: Promise<{ estado?: string; pago?: string; buscar?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  const profile = await getCurrentUserProfile();
  const { estado, pago, buscar } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <PageHeader eyebrow="Operación" title="Gestión de pedidos" description="Revisa los pagos y acompaña cada pedido desde la preparación hasta la entrega o el recojo." />
      <OrdersPanel
        key={buscar ?? "orders"}
        initialSearch={buscar}
        role={profile?.role ?? "empleado"}
        initialStatus={estado}
        initialPendingPaymentOnly={pago === "pendiente"}
      />
    </div>
  );
}