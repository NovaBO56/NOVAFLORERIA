import { redirect } from "next/navigation";
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
    <div className="theme-admin min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>

      <AdminSidebar sections={sections} />

      <div className="flex min-h-dvh min-w-0 flex-col bg-admin-wash-end bg-[linear-gradient(to_bottom,var(--admin-wash-start),var(--admin-wash-end)_280px)] bg-no-repeat">
        <AdminHeader
          name={profile.full_name}
          role={profile.role}
          sections={sections}
        />

        <SessionGuard />

        {/* Es un <div> y no <main>: las páginas existentes ya traen su propio <main>. */}
        <div id="contenido" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}