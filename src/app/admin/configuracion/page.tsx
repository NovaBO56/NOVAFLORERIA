import { requireAdmin } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { CheckoutConfiguration } from "@/components/admin/checkout-configuration";
import SystemSettings from "@/components/admin/system-settings";

export default async function ConfigurationPage() {
  try { await requireAdmin(); } catch { return <AccessDenied />; }
  return <div className="mx-auto flex max-w-5xl flex-col gap-6"><h1>Configuración</h1><CheckoutConfiguration /><h2>Configuración general</h2><SystemSettings /></div>;
}
