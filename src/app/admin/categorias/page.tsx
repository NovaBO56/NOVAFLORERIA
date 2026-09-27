import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import CategoryManagement from "@/components/admin/products/category-management";

export default async function AdminCategoriesPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1>Gestión de categorías</h1>
        <p className="text-text-secondary">
          Administra las categorías utilizadas en el catálogo de productos.
        </p>
      </div>

      <CategoryManagement />
    </div>
  );
}