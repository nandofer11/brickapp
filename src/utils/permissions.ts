import { useSession } from "next-auth/react";

/**
 * Hook personalizado para comprobar si el usuario tiene un permiso específico
 * @param permissionName Nombre del permiso a verificar
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export function useHasPermission(permissionName: string): boolean {
  const { data: session } = useSession();
  
  if (!session || !session.user || !session.user.permisos) {
    return false;
  }
  
  return session.user.permisos.some(
    (permission) => permission.nombre === permissionName
  );
}

/**
 * Hook para verificar si el usuario tiene alguno de los permisos especificados
 * @param permissionNames Lista de nombres de permisos a verificar
 * @returns true si el usuario tiene al menos uno de los permisos, false en caso contrario
 */
export function useHasAnyPermission(permissionNames: string[]): boolean {
  const { data: session } = useSession();
  
  if (!session || !session.user || !session.user.permisos) {
    return false;
  }
  
  return session.user.permisos.some(
    (permission) => permissionNames.includes(permission.nombre)
  );
}

/**
 * Hook para verificar si el usuario tiene todos los permisos especificados
 * @param permissionNames Lista de nombres de permisos a verificar
 * @returns true si el usuario tiene todos los permisos, false en caso contrario
 */
export function useHasAllPermissions(permissionNames: string[]): boolean {
  const { data: session } = useSession();
  
  if (!session || !session.user || !session.user.permisos) {
    return false;
  }
  
  const userPermissionNames = session.user.permisos.map(p => p.nombre);
  return permissionNames.every(perm => userPermissionNames.includes(perm));
} 