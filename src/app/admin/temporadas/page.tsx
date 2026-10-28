import { PageHeader } from "@/components/ui/page-header";
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader eyebrow="Catálogo" title="Temporadas" description="Organiza las campañas y ocasiones especiales del catálogo." />

      <SeasonManagement />
    </div>
  );
}