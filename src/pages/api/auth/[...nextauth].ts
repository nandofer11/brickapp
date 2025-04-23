import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from '@/lib/prisma';

export const authOptions: AuthOptions = {
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

          // Buscar usuario con una sola consulta
          const userData = await prisma.$queryRaw`
            SELECT 
              u.id_usuario, 
              u.nombre_completo,
              u.usuario,
              u.contrasena,
              u.id_rol,
              u.id_empresa,
              r.nombre as rol_nombre,
              e.razon_social
            FROM usuario u 
            LEFT JOIN empresa e ON u.id_empresa = e.id_empresa
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            WHERE u.usuario = ${credentials.usuario}
          `;

          if (!Array.isArray(userData) || userData.length === 0) {
            return null;
          }

          const user = userData[0] as any;

          // Verificar contraseña
          let isValid = false;
          
          try {
            // Intentar con bcrypt
            isValid = await compare(credentials.contrasena, user.contrasena);
          } catch (e) {
            // Si falla bcrypt, intentar con texto plano
            isValid = credentials.contrasena === user.contrasena;
          }

          if (!isValid) {
            return null;
          }

          // Retornar un objeto simple para evitar problemas de serialización
          return {
            id: String(user.id_usuario),
            name: user.nombre_completo,
            email: user.email || `${user.usuario}@example.com`, // NextAuth requiere email
            usuario: user.usuario,
            id_empresa: String(user.id_empresa),
            id_rol: String(user.id_rol),
            rol: user.rol_nombre || "Sin rol",
            razon_social: user.razon_social || "No especificado",
          };
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
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Asegurarnos de que el token tenga una estructura básica correcta
        // y que sea serializable en JSON
        token.user = {
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          usuario: user.usuario || null,
          id_empresa: user.id_empresa || null,
          id_rol: user.id_rol || null,
          rol: user.rol || null,
          razon_social: user.razon_social || null
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
