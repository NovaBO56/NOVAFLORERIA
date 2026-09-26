"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";

export function SessionGuard() {
  const router = useRouter();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      try {
        const url = new URL(response.url, window.location.origin);
        const sameOrigin = url.origin === window.location.origin;
        if (sameOrigin && (response.status === 401 || (response.redirected && url.pathname === "/login"))) {
          setExpired(true);
        }
      } catch {
        // URL no interpretable: no se considera sesión vencida.
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  function goToLogin() {
    const current = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(current)}`);
  }

  return (
    <Modal open={expired}>
      <ModalContent dismissible={false} showCloseButton={false}>
        <ModalHeader>
          <ModalTitle>Tu sesión expiró</ModalTitle>
          <ModalDescription>
            Inicia sesión de nuevo para continuar. Volverás a esta misma página.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <Button onClick={goToLogin}>Iniciar sesión</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}