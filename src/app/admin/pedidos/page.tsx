import { AccessDenied } from "@/components/admin/layout/access-denied";
import { OrdersPanel } from "@/components/admin/orders/orders-panel";
import { getCurrentUserProfile, requireEmployeeOrAdmin } from "@/lib/auth/permissions";

type PageProps = {
  searchParams: Promise<{ estado?: string; pago?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    return <AccessDenied />;
  }

  const profile = await getCurrentUserProfile();
  const { estado, pago } = await searchParams;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1>Pedidos</h1>
        <p className="text-text-secondary">
          Confirma pagos, avanza el estado de preparación y gestiona cancelaciones.
        </p>
      </div>
      <OrdersPanel
        role={profile?.role ?? "empleado"}
        initialStatus={estado}
        initialPendingPaymentOnly={pago === "pendiente"}
      />
    </div>
  );
}