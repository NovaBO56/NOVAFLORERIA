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
      <div>
        <h1>Gestión de Pedidos</h1>
        <p className="text-text-secondary">
          Confirma pagos, avanza el estado de preparación y gestiona cancelaciones.
        </p>
      </div>
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