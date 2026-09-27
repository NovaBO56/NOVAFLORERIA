import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import SeasonManagement from "@/components/admin/season-management";

export default async function AdminSeasonsPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1>Gestión de temporadas</h1>
        <p className="text-text-secondary">
          Administra las temporadas utilizadas en el catálogo de productos.
        </p>
      </div>

      <SeasonManagement />
    </div>
  );
}