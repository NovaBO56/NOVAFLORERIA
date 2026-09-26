import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminHomeHref } from "@/config/admin-navigation";
import { canUseEmployeeFunctions, getCurrentUserProfile } from "@/lib/auth/permissions";

/**
 * Ruta inexistente (Fase 15 §4.1). Al personal con sesión se le ofrece volver al
 * panel; al resto, volver al inicio.
 */
export default async function NotFound() {
  let href = "/";
  let label = "Ir al inicio";
  let theme = "theme-public";

  try {
    const profile = await getCurrentUserProfile();
    if (profile && canUseEmployeeFunctions(profile)) {
      href = getAdminHomeHref(profile.role);
      label = "Volver al panel";
      theme = "theme-admin";
    }
  } catch {
    // Sin sesión o sin acceso a Supabase: se muestra la versión pública.
  }

  return (
    <main className={`${theme} flex min-h-dvh items-center justify-center p-4`}>
      <Card className="w-full max-w-md items-center text-center">
        <SearchX aria-hidden="true" className="size-10 stroke-[1.5] text-text-secondary" />
        <div className="flex flex-col gap-2">
          <h1>No encontramos esta página</h1>
          <p className="text-text-secondary">
            La dirección no existe o fue movida. Verifica el enlace e inténtalo de nuevo.
          </p>
        </div>
        <Button asChild>
          <Link href={href}>{label}</Link>
        </Button>
      </Card>
    </main>
  );
}