// import { getToken } from "next-auth/jwt";
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export async function authMiddleware(req: NextRequest) {
//   // Verificar si estamos en la página de login
//   if (req.nextUrl.pathname === "/auth") {
//     return NextResponse.next();
//   }

//   try {
//     // Obtener el token con depuración
//     console.log("🔍 Verificando token para:", req.nextUrl.pathname);
//     console.log("🔑 Secret disponible:", !!process.env.NEXTAUTH_SECRET);
    
//     const token = await getToken({ 
//       req, 
//       secret: process.env.NEXTAUTH_SECRET
//     });

//     console.log("🔐 Token encontrado:", !!token);
    
//     if (!token) {
//       console.log("❌ No hay token, redirigiendo a /auth");
//       const url = new URL("/auth", req.url);
//       // Agregar la URL original como parámetro para redireccionar después del login
//       url.searchParams.set("callbackUrl", req.url);
//       return NextResponse.redirect(url);
//     }

//     // Verificar permisos específicos si es necesario
//     const requiredPermissions = req.nextUrl.pathname.startsWith("/admin")
//       ? ["VER_USUARIOS"] // Ejemplo de permiso requerido
//       : [];

//     if (requiredPermissions.length > 0) {
//       const userPermissions = token.user?.permisos || [];
//       const hasPermission = requiredPermissions.every((permiso) =>
//         userPermissions.includes(permiso)
//       );

//       if (!hasPermission) {
//         console.log("❌ Permisos insuficientes, redirigiendo a /auth");
//         return NextResponse.redirect(new URL("/auth", req.url));
//       }
//     }

//     // Si hay token pero vamos a /auth, redirigir al dashboard
//     if (req.nextUrl.pathname === "/auth" && token) {
//       console.log("✅ Token válido en /auth, redirigiendo a /admin/dashboard");
//       return NextResponse.redirect(new URL("/admin/dashboard", req.url));
//     }

//     console.log("✅ Token válido, permitiendo acceso a:", req.nextUrl.pathname);
//     return NextResponse.next();
//   } catch (error) {
//     console.error("🔥 Error en middleware de autenticación:", error);
//     // En caso de error, permitir la redirección al login
//     return NextResponse.redirect(new URL("/auth", req.url));
//   }
// }
