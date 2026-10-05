import { redirect } from "next/navigation";
import {
  canUseAdminFunctions,
  requireEmployeeOrAdmin,
} from "@/lib/auth/permissions";
import PromotionManagement from "@/components/admin/promotions/promotion-management";

export default async function AdminPromotionsPage() {
  let isAdmin = false;

  try {
    const profile = await requireEmployeeOrAdmin();

    isAdmin = canUseAdminFunctions(profile);
  } catch {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1>Gestión de promociones</h1>
        <p className="text-text-secondary">
          {isAdmin
            ? "Crea y administra las promociones, descuentos y beneficios para tus clientes."
            : "Consulta las promociones disponibles. Solo un administrador puede crearlas o modificarlas."}
        </p>
      </div>

      <PromotionManagement isAdmin={isAdmin} />
    </div>
  );
}