import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { requireAdmin } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/admin/layout/access-denied";
import { CheckoutConfiguration } from "@/components/admin/checkout-configuration";
import SystemSettings from "@/components/admin/system-settings";
import { StorefrontMediaConfiguration } from "@/components/admin/storefront-media-configuration";

export default async function ConfigurationPage() {
  try { await requireAdmin(); } catch { return <AccessDenied />; }
  return <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6"><PageHeader eyebrow="Administración" title="Configuración" description="Administra la atención, los medios de pago y las opciones de la tienda." /><CheckoutConfiguration /><StorefrontMediaConfiguration /><SectionCard title="Preferencias generales" description="Controla la disponibilidad de servicios y otras opciones del sistema."><SystemSettings /></SectionCard></div>;
}
