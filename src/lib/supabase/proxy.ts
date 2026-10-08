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

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isAuthenticated = Boolean(data?.claims?.sub);

  // Rutas públicas: el cliente de la florería no tiene cuenta, así que
  // la tienda y sus APIs no pueden exigir sesión. La seguridad real vive
  // en las políticas RLS y en funciones como create_order(), no aquí.
  //
  // Cada ruta pública nueva debe agregarse a esta lista; si no, un
  // visitante sin sesión es redirigido a /login.
  const publicApiRoutes = [
    "/api/orders",
    "/api/payment-qr",
    "/api/whatsapp-config",
    "/api/business-hours",
    "/api/products",
    "/api/categories",
    "/api/seasons",
    "/api/promotions",
  ];

  // Páginas públicas (coincidencia exacta).
  const publicPages = ["/", "/checkout", "/seguimiento"];

  const isPublicApiRoute = publicApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isPublicPage = publicPages.includes(pathname);

  if (!isAuthenticated && !isLoginPage && !isPublicApiRoute && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);

    // Fase 15 §4.1: al expulsar de una ruta /admin sin sesión, se conserva
    // la URL a la que se quería volver (?redirect=/admin/productos).
    if (pathname.startsWith("/admin")) {
      loginUrl.searchParams.set(
        "redirect",
        `${pathname}${request.nextUrl.search}`,
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginPage) {
    const redirect = request.nextUrl.searchParams.get("redirect");

    const destination =
      redirect && redirect.startsWith("/") ? redirect : "/admin";

    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}
