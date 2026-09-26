import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminHomeHref } from "@/config/admin-navigation";

export function AccessDenied() {
  return (
    <Card className="mx-auto mt-8 w-full max-w-md items-center text-center">
      <Lock aria-hidden="true" className="size-10 stroke-[1.5] text-text-secondary" />
      <div className="flex flex-col gap-2">
        <h1>Acceso no autorizado</h1>
        <p className="text-text-secondary">
          No tienes permisos para ver esta sección. Si crees que es un error, contacta a un
          administrador.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href={getAdminHomeHref("empleado")}>Volver al panel</Link>
      </Button>
    </Card>
  );
}