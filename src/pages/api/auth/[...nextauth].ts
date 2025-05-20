import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from '@/lib/prisma';
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        usuario: { label: "Usuario", type: "text" },
        contrasena: { label: "Contraseña", type: "password" }
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
              email: user.email || `${user.usuario}@example.com`,
              usuario: user.usuario,
              id_empresa: user.id_empresa,
              id_rol: user.id_rol,
              rol: user.rol?.nombre || "Sin rol",
              empresa: {
                id_empresa: user.empresa?.id_empresa,
                razon_social: user.empresa?.razon_social,
                ruc: user.empresa?.ruc,
                direccion: user.empresa?.direccion,
              }
            };

          }
          return null;
        } catch (error) {
          console.error("Error en autenticación:", error);
          throw new Error("Error en autenticación");
        }
      }
    })
  ],
  pages: {
    signIn: '/auth',
    error: '/auth/error',
    signOut: '/auth'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = token.user as any;
      }
      return session;
    },
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
          rol: dbUser?.rol?.nombre || "Sin rol",
          permisos: dbUser?.rol?.rol_permiso.map((rp) => rp.permiso.nombre) || [],
          empresa: {
            id_empresa: dbUser?.empresa?.id_empresa,
            razon_social: dbUser?.empresa?.razon_social,
            ruc: dbUser?.empresa?.ruc,
            direccion: dbUser?.empresa?.direccion
          }
        };

      }
      return token;
    }
  },
  events: {
    async signIn({ user }) {
      console.log("Usuario conectado:", user);
    },
    async signOut({ token }) {
      console.log("Usuario desconectado");
    }
  },
  debug: process.env.NODE_ENV === 'development'
};

export default NextAuth(authOptions);