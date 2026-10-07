import { useSyncExternalStore } from "react";

/**
 * Pequeño almacén reactivo respaldado por localStorage.
 *
 * - Seguro con SSR: en el servidor (y durante la hidratación) devuelve
 *   `initial`; después React lo actualiza con lo guardado, sin errores
 *   de hidratación.
 * - Sincroniza varias pestañas (evento "storage").
 * - Si localStorage no está disponible (modo privado, cuota llena) sigue
 *   funcionando en memoria.
 */
export type LocalStore<T> = {
  useValue: () => T;
  get: () => T;
  update: (updater: (current: T) => T) => void;
};

export function createLocalStore<T>(options: {
  key: string;
  initial: T;
  sanitize: (raw: unknown) => T;
}): LocalStore<T> {
  const { key, initial, sanitize } = options;

  let snapshot: T = initial;
  let loaded = false;

  const listeners = new Set<() => void>();

  function load(): T {
    try {
      const raw = window.localStorage.getItem(key);

      return raw ? sanitize(JSON.parse(raw)) : initial;
    } catch {
      return initial;
    }
  }

  function get(): T {
    if (typeof window === "undefined") return initial;

    if (!loaded) {
      loaded = true;
      snapshot = load();
    }

    return snapshot;
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function update(updater: (current: T) => T) {
    const next = updater(get());

    snapshot = next;

    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Almacenamiento no disponible: el valor queda solo en memoria.
    }

    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key) return;

      loaded = true;
      snapshot = load();
      emit();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue() {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { useValue, get, update };
}