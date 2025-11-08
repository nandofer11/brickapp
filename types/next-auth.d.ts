import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    usuario?: string;
    id_empresa?: number;
    id_rol?: number;
    rol?: string;
    nombre_completo?: string;
    permisos?: string[];
    empresa?: {
      id_empresa?: number;
      razon_social?: string;
      ruc?: string;
      direccion?: string;
    };
  }

  interface Session {
    user: User;
  }
}