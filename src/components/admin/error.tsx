"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Límite de error de /admin (Fase 15 §4.1): mensaje genérico + reintentar. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en el panel de administración:", error);
  }, [error]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-md items-center text-center">
      <TriangleAlert aria-hidden="true" className="size-10 stroke-[1.5] text-danger" />
      <div className="flex flex-col gap-2">
        <h1>Algo salió mal</h1>
        <p className="text-text-secondary">
          No pudimos completar la acción. Inténtalo de nuevo; si el problema continúa, avisa a un
          administrador.
        </p>
        {error.digest && (
          <p className="font-mono text-[13px] text-text-secondary">Código: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </Card>
  );
}