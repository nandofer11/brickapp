import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { AuthUser } from '@/hooks/useAuth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permiso: string) => boolean;
  hasAllPermissions: (permisos: string[]) => boolean;
  hasAnyPermission: (permisos: string[]) => boolean;
  empresa: number | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasPermission: () => false,
  hasAllPermissions: () => false,
  hasAnyPermission: () => false,
  empresa: null
});

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Si hay sesión pero no tiene la estructura esperada
    if (!session?.user || !session?.user?.permisos) {
      // Intentar cargar los permisos desde el servidor
      fetchUserData();
    } else {
      // Usar los datos de la sesión
      setUser({
        id: Number(session.user.id),
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || undefined,
        id_empresa: Number(session.user.id_empresa),
        id_rol: Number(session.user.id_rol),
        rol: session.user.rol,
        permisos: session.user.permisos || []
      });
      setIsLoading(false);
    }
  }, [session, status]);

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
      setIsLoading(false);
    }
  };

  const hasPermission = (permiso: string): boolean => {
    if (!user || !user.permisos || user.permisos.length === 0) {
      return false;
    }
    return user.permisos.includes(permiso);
  };

  const hasAllPermissions = (permisos: string[]): boolean => {
    if (!user || !user.permisos || user.permisos.length === 0) {
      return false;
    }
    return permisos.every(p => user.permisos.includes(p));
  };

  const hasAnyPermission = (permisos: string[]): boolean => {
    if (!user || !user.permisos || user.permisos.length === 0) {
      return false;
    }
    return permisos.some(p => user.permisos.includes(p));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    empresa: user?.id_empresa || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 