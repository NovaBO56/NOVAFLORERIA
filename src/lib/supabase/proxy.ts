import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
 const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Error verificando sesión:", error);
  }

    const isLoginPage = request.nextUrl.pathname === "/login";
  const isAuthenticated = Boolean(data?.claims?.sub);

  // Rutas públicas: el checkout de pedidos no requiere sesión
  // (el cliente de la florería no tiene cuenta). La seguridad real
  // de esa ruta vive en la función create_order() de Postgres, no aquí.
  const publicApiRoutes = ["/api/orders", "/api/payment-qr", "/api/whatsapp-config", "/api/business-hours"];

  const isPublicApiRoute = publicApiRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  );

  if (!isAuthenticated && !isLoginPage && !isPublicApiRoute) {
    const loginUrl = new URL("/login", request.url);

    // Fase 15 §4.1: al expulsar de una ruta /admin sin sesión, se conserva
    // la URL a la que se quería volver (?redirect=/admin/productos).
    if (request.nextUrl.pathname.startsWith("/admin")) {
      loginUrl.searchParams.set(
        "redirect",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}