import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // Verificar también si existe la cookie de sesión explícitamente
  const sessionCookie = req.cookies.get('next-auth.session-token');
  
  // Si no hay cookie de sesión, considerar que no está autenticado
  const isAuthenticated = token && sessionCookie;

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/',
    '/auth', 
    '/registrar_empresa',
    '/api/auth',
    '/_next',
    '/favicon.ico'
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath && pathname !== '/auth') {
    return NextResponse.next();
  }

  // Si está autenticado y trata de acceder a /auth, redirigir al dashboard
  if (isAuthenticated && pathname === "/auth") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Si no está autenticado y trata de acceder a rutas protegidas
  if (!isAuthenticated && pathname.startsWith("/admin")) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${callbackUrl}`, req.url));
  }

  // Si no está autenticado y no está en rutas públicas
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    // Rutas de autenticación
    "/auth/:path*",
    
    // Todas las rutas administrativas
    "/admin/:path*",
    
    // Rutas específicas que necesitan protección
    "/dashboard/:path*",
    
    // Excluir archivos estáticos y API routes de NextAuth
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
