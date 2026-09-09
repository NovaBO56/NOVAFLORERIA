
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";
import SeasonManagement from "@/components/admin/season-management";

export default async function AdminSeasonsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Gestión de temporadas
          </h1>

          <p className="mt-2 text-muted-foreground">
            Administra las temporadas utilizadas en el catálogo de
            productos.
          </p>
        </div>

        <SeasonManagement />
      </div>
    </main>
  );
}
