import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import ProductManagement from "@/components/admin/products/product-management";

export default async function AdminProductsPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1>Gestión de productos</h1>
        <p className="text-text-secondary">
          Administra los productos disponibles en el catálogo de la florería.
        </p>
      </div>

      <ProductManagement />
    </div>
  );
}