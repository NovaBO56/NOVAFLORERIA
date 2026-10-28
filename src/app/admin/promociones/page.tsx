import { PageHeader } from "@/components/ui/page-header";
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader eyebrow="Catálogo" title="Promociones" description={isAdmin ? "Crea descuentos y combos, define sus productos y revisa su vigencia." : "Consulta los descuentos y combos disponibles. Su edición está reservada al administrador."} />

      <PromotionManagement isAdmin={isAdmin} />
    </div>
  );
}