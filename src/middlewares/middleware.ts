// import { authMiddleware } from "@/middlewares/authMiddleware";
// import { NextRequest, NextResponse } from "next/server";

// // Este middleware se ejecuta en todas las rutas
// export default function middleware(req: NextRequest) {
//   console.log("🚀 Middleware ejecutándose para:", req.nextUrl.pathname);
  
//   // Proteger rutas admin y API (excepto autenticación y rutas públicas)
//   if (req.nextUrl.pathname.startsWith("/admin")) {
//     return authMiddleware(req);
//   }
  
//   // Excluir las rutas de autenticación del middleware
//   if (req.nextUrl.pathname.startsWith("/api/auth")) {
//     return NextResponse.next();
//   }
  
//   // Otras APIs también requieren autenticación
//   if (req.nextUrl.pathname.startsWith("/api")) {
//     return authMiddleware(req);
//   }
  
//   // Para otras rutas, permitir acceso
//   return NextResponse.next();
// }

// // Configurar el matcher para que solo se aplique a ciertas rutas
// export const config = {
//   matcher: [
//     /*
//      * Excluir archivos de la aplicación:
//      * - Imágenes (PNG, JPG, etc)
//      * - Fuentes
//      * - Recursos estáticos
//      */
//     '/((?!_next/static|_next/image|favicon.ico).*)',
//   ],
// };
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth",
  },
});

export const config = {
  matcher: ["/admin/:path*"], // protege todo lo que esté bajo /admin/
};
