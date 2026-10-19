import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { visualPreviewEnabled } from "@/lib/visual-preview/config";
import { visualOnlyMessage } from "@/lib/visual-preview/catalog";

export async function proxy(request: NextRequest) {
  try {
    if (visualPreviewEnabled(process.env)) {
      const pathname = request.nextUrl.pathname;
      if (!["GET", "HEAD"].includes(request.method)) return NextResponse.json({ success: false, message: visualOnlyMessage }, { status: 403 });
      if (pathname.startsWith("/api/") && pathname !== "/api/visual-preview") {
        const target = request.nextUrl.clone(); target.pathname = "/api/visual-preview"; target.searchParams.set("path", pathname);
        return NextResponse.rewrite(target);
      }
      if (!["/", "/checkout", "/seguimiento", "/api/visual-preview"].includes(pathname)) return new NextResponse("No disponible en la vista previa visual.", { status: 404 });
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set("Content-Security-Policy", "connect-src 'self'; img-src 'self' data: blob:; frame-src 'none'; form-action 'self'");
      return response;
    }
  } catch { return new NextResponse("Configuración de Preview no aislada.", { status: 503 }); }
  if (process.env.NODE_ENV === "production" && ["/prueba-cliente", "/admin/prueba-ui"].some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/"))) {
    return new NextResponse("No encontrado", { status: 404 });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
