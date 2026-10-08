import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && ["/prueba-cliente", "/admin/prueba-ui"].some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/"))) {
    return new NextResponse("No encontrado", { status: 404 });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};