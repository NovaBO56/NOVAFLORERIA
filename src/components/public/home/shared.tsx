"use client";

import { useEffect, useRef } from "react";
import { Dancing_Script, Lato } from "next/font/google";

/* ============================================================
   Fuentes de la tienda pública (las mismas del diseño aprobado).
   ============================================================ */

export const lato = Lato({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const script = Dancing_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/* ============================================================
   Desplazamiento a una sección (respeta "reducir movimiento").
   ============================================================ */

export function scrollToId(id: string) {
  const element = document.getElementById(id);

  if (!element) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  element.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

/* ============================================================
   Comportamiento accesible de un panel modal (menú, carrito):
   - Escape cierra.
   - El foco entra al panel, se queda dentro con Tab y vuelve al
     botón que lo abrió al cerrar.
   - Se bloquea el scroll de la página mientras está abierto.
   ============================================================ */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialog<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const panelRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusable = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    (focusable()[0] ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusable();

      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return panelRef;
}