import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import PromotionManagement from "@/components/admin/promotions/promotion-management";

export default async function AdminPromotionsPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1>Gestión de promociones</h1>
        <p className="text-text-secondary">
          Crea y administra las promociones, descuentos y beneficios para tus
          clientes.
        </p>
      </div>

      <PromotionManagement />
    </div>
  );
}