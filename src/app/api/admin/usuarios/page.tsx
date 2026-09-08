
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de usuarios</h1>
          <p className="mt-2 text-muted-foreground">
            Administración de usuarios, roles y estados.
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <p>
            La gestión de usuarios estará disponible aquí.
          </p>
        </div>
      </div>
    </main>
  );
}
