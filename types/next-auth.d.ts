import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    usuario?: string;
    id_empresa?: string;
    id_rol?: string;
    rol?: string;
    razon_social?: string;
    permisos?: any[];
  }

  interface Session {
    user: User;
  }
}