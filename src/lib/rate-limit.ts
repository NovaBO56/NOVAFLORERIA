import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Límites por ruta pública sensible. Aprobados con el usuario en
 * FASE 14 — ver plan-fases del proyecto para el razonamiento detrás
 * de cada valor.
 *
 * Estos son datos puros (sin lógica de red ni de Supabase), así que
 * se pueden testear directamente sin necesitar una base de datos.
 */
export const RATE_LIMITS = {
  trackOrder: { maxAttempts: 20, windowSeconds: 5 * 60 },
  orderReceipt: { maxAttempts: 10, windowSeconds: 5 * 60 },
  createOrder: { maxAttempts: 10, windowSeconds: 5 * 60 },
  reportPayment: { maxAttempts: 5, windowSeconds: 5 * 60 },
  getPaymentQr: { maxAttempts: 30, windowSeconds: 60 },
  getBusinessHours: { maxAttempts: 30, windowSeconds: 60 },
  getWhatsappConfig: { maxAttempts: 30, windowSeconds: 60 },
} as const;

export type RateLimitedRoute = keyof typeof RATE_LIMITS;

/**
 * Extrae la IP del cliente a partir de los headers estándar que
 * ponen los proxies (Vercel incluido). x-forwarded-for puede traer
 * una lista "cliente, proxy1, proxy2" — la primera es la del cliente
 * real. Si no hay ningún header (ej. desarrollo local sin proxy),
 * cae a "unknown" en vez de fallar: no queremos que un problema de
 * detección de IP tumbe una ruta pública.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Llama a la función atómica check_rate_limit() de Supabase para la
 * ruta indicada. Devuelve true si el intento está permitido.
 *
 * El servidor usa su cliente privado: el RPC no es accesible públicamente.
 * Escrituras, seguimiento y recibos fallan cerrados; otras lecturas pueden continuar.
 */
export async function checkRateLimit(
  _supabase: SupabaseClient,
  request: Request,
  route: RateLimitedRoute,
): Promise<boolean> {
  const { maxAttempts, windowSeconds } = RATE_LIMITS[route];
  const ip = getClientIp(request);

  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_ip: ip,
    p_route: route,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`Error verificando rate limit para "${route}":`, error);
    return route !== "createOrder" && route !== "reportPayment" && route !== "orderReceipt" && route !== "trackOrder";
  }

  return data === true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: "Demasiados intentos. Espera un momento y vuelve a intentar.",
    },
    { status: 429 },
  );
}
