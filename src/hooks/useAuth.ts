import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  image?: string;
  id_empresa: number;
  id_rol: number;
  rol?: string;
  permisos: string[];
}

// Extendemos la interfaz de Session para TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id_empresa: number;
      id_rol: number;
      rol?: string;
      permisos?: string[];
    }
  }
}

/**
 * Hook para usar en componentes cliente que necesiten información de autenticación
 * y verificación de permisos
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
      setLoading(false);
      return;
    }

    // Si hay sesión pero no tiene la estructura esperada
    if (!session?.user || !session?.user?.permisos) {
      // Intentar cargar los permisos desde el servidor
      fetchUserData();
    } else {
      // Usar los datos de la sesión
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || undefined,
        id_empresa: session.user.id_empresa,
        id_rol: session.user.id_rol,
        rol: session.user.rol,
        permisos: session.user.permisos || []
      });
      setLoading(false);
    }
  }, [session, status]);

  /**
   * Carga datos del usuario desde el servidor (permisos, roles, etc.)
   */
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param permiso Permiso a verificar
   * @returns true si tiene el permiso, false en caso contrario
   */
  const hasPermission = (permiso: string): boolean => {
    if (!user || !user.permisos || user.permisos.length === 0) {
      return false;
    }
    return user.permisos.includes(permiso);
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param permisos Lista de permisos a verificar
   * @returns true si tiene todos los permisos, false en caso contrario
   */
  const hasAllPermissions = (permisos: string[]): boolean => {
    if (!user || !user.permisos || user.permisos.length === 0) {
      return false;
    }
    return permisos.every(p => user.permisos.includes(p));
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   * @param permisos Lista de permisos a verificar
   * @returns true si tiene al menos uno de los permisos, false en caso contrario
   */
  const hasAnyPermission = (permisos: string[]): boolean => {
    if (!user || !user.permisos || user.permisos.length === 0) {
      return false;
    }
    return permisos.some(p => user.permisos.includes(p));
  };

  /**
   * Verifica si el usuario pertenece a la empresa especificada
   * @param idEmpresa ID de la empresa
   * @returns true si pertenece a la empresa, false en caso contrario
   */
  const belongsToCompany = (idEmpresa: number): boolean => {
    return user?.id_empresa === idEmpresa;
  };

  /**
   * Verifica si el usuario tiene el rol especificado
   * @param idRol ID del rol
   * @returns true si tiene el rol, false en caso contrario
   */
  const hasRole = (idRol: number): boolean => {
    return user?.id_rol === idRol;
  };

  return {
    user,
    loading,
    isLoggedIn: !!user,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    belongsToCompany,
    hasRole
  };
} 