
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";
import ProductManagement from "@/components/admin/product-management";

export default async function AdminProductsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de productos</h1>
          <p className="mt-2 text-muted-foreground">
            Administra los productos disponibles en el catálogo de la florería.
          </p>
        </div>

        <ProductManagement />
      </div>
    </main>
  );
}
