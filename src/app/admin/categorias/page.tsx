import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import CategoryManagement from "@/components/admin/products/category-management";

export default async function AdminCategoriesPage() {
 try {
  await requireEmployeeOrAdmin();
} catch {
  redirect("/login");
}

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader eyebrow="Catálogo" title="Categorías" description="Organiza los productos del catálogo y administra las categorías disponibles." />

      <CategoryManagement />
    </div>
  );
}