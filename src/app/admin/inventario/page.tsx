
import { redirect } from "next/navigation";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import InventoryManagement from "@/components/admin/inventory/inventory-management";

export default async function AdminInventoryPage() {
  try {
    await requireEmployeeOrAdmin();
  } catch {
    redirect("/");
  }

  return <InventoryManagement />;
}
