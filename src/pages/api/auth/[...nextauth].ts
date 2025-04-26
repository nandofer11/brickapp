import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from '@/lib/prisma';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        usuario: { label: "Usuario", type: "text" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.usuario || !credentials?.contrasena) {
            return null;
          }

          const user = await prisma.usuario.findUnique({
            where: { usuario: credentials.usuario },
            include: {
              rol: true,
              empresa: true,
            },
          });

          if (user && await compare(credentials.contrasena, user.contrasena)) {
            return {
              id: String(user.id_usuario),
              name: user.nombre_completo,
              email: user.email || `${user.usuario}@example.com`, // NextAuth requiere email
              usuario: user.usuario,
              id_empresa: Number(user.id_empresa),
              id_rol: Number(user.id_rol),
              rol: user.rol?.nombre || "Sin rol",
              razon_social: user.empresa?.razon_social || "No especificado",
            };
          }
          return null;
        } catch (error) {
          console.error("Error en autenticación:", error);
          throw new Error("Error en autenticación");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Incluir roles, permisos, razón social y nombre completo en el token
        const dbUser = await prisma.usuario.findUnique({
          where: { id_usuario: Number(user.id) },
          include: {
            rol: {
              include: {
                rol_permiso: {
                  include: { permiso: true }
                }
              }
            },
            empresa: true,
          }
        });

        token.user = {
          id: dbUser?.id_usuario,
          id_empresa: dbUser?.id_empresa,
          id_rol: dbUser?.id_rol,
          nombre_completo: dbUser?.nombre_completo,
          razon_social: dbUser?.empresa?.razon_social || "No especificado",
          rol: dbUser?.rol?.nombre || "Sin rol",
          permisos: dbUser?.rol?.rol_permiso.map((rp) => rp.permiso.nombre) || []
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Pasar roles, permisos, razón social y nombre completo a la sesión
      session.user = token.user as {
        id: number;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
        id_empresa: number;
        id_rol: number;
        nombre_completo: string;
        razon_social: string;
        rol: string;
        permisos: string[];
      };
      return session;
    }
  },
};

export default NextAuth(authOptions);
