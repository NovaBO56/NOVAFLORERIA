import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import ProductManagement from "@/components/admin/products/product-management";

export default async function AdminProductsPage() {
  let profile;
  try {
    profile = await requireEmployeeOrAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="admin-page mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <ProductManagement canManageRecommendations={profile.role === "administrador"} />
    </div>
  );
}
