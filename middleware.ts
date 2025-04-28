import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("next-auth.session-token")?.value;
  const { pathname } = req.nextUrl;

  // Redirección desde /auth si hay un token
  if (token && pathname === "/auth") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Redirección desde /admin si no hay un token
  if (!token && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Permitir el acceso a otras rutas
  return NextResponse.next();
}

// Configurar las rutas donde se aplica el middleware
export const config = {
  matcher: ["/auth", "/admin/:path*"],
};
