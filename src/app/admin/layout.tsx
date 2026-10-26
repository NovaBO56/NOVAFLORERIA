import { redirect } from "next/navigation";
import { PageMotion } from "@/components/admin/layout/page-motion";
import { AccountDisabled } from "@/components/admin/layout/account-disabled";
import { AdminHeader } from "@/components/admin/layout/admin-header";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { SessionGuard } from "@/components/admin/layout/session-guard";
import { getNavSectionsForRole } from "@/config/admin-navigation";
import {
  canUseEmployeeFunctions,
  getCurrentUserProfile,
} from "@/lib/auth/permissions";

/**
 * Layout común de /admin (Fase 15 §2.1 y §4.1).
 * Lee el perfil una sola vez y filtra la navegación por rol. La navegación es
 * comodidad, no seguridad: cada ruta API y cada página siguen validando permisos.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.is_active || !canUseEmployeeFunctions(profile)) {
    return (
      <div className="theme-admin min-h-dvh">
        <AccountDisabled />
      </div>
    );
  }

  const sections = getNavSectionsForRole(profile.role);

  return (
    <div className="theme-admin admin-workspace min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>

      <AdminHeader name={profile.full_name} role={profile.role} sections={sections} />
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <AdminSidebar sections={sections} />

      <div className="flex min-h-[calc(100dvh-4rem)] min-w-0 flex-col bg-bg-admin">


        <SessionGuard />

        {/* Es un <div> y no <main>: las páginas existentes ya traen su propio <main>. */}
        <div id="contenido" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <PageMotion>{children}</PageMotion>
        </div>
      </div>
      </div>
    </div>
  );
}