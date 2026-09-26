"use client";

import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSignOut } from "./use-sign-out";

export function AccountDisabled() {
  const { signOut, pending } = useSignOut();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md items-center text-center">
        <Ban aria-hidden="true" className="size-10 stroke-[1.5] text-text-secondary" />
        <div className="flex flex-col gap-2">
          <h1>Tu cuenta está desactivada</h1>
          <p className="text-text-secondary">Contacta a un administrador.</p>
        </div>
        <Button onClick={signOut} loading={pending} loadingText="Saliendo…">
          Cerrar sesión
        </Button>
      </Card>
    </main>
  );
}