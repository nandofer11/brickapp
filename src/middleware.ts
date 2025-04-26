import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth", // Redirigir a esta página si no está autenticado
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/protected/:path*"], // Excluir la ruta "/"
};
