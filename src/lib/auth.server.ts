import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from './prisma';

/**
 * Verifica si el usuario tiene un permiso específico
 * @param permisoRequerido El permiso que se requiere para acceder
 * @param req Objeto de solicitud
 * @param res Objeto de respuesta (opcional, para APIs)
 * @returns true si tiene permiso, false en caso contrario
 */
export async function requirePermiso(
  permisoRequerido: string,
  req: NextApiRequest | NextRequest,
  res?: NextApiResponse
): Promise<boolean> {
  // Si no se especifica un permiso, se permite el acceso
  if (!permisoRequerido) return true;

  try {
    // Obtener la sesión del servidor
    const session = await getServerSession(authOptions);

    // Si no hay sesión, no tiene permiso
    if (!session || !session.user) {
      if (res) {
        res.status(401).json({ error: 'No autorizado. Inicie sesión para continuar.' });
      }
      return false;
    }

    // Verificar si los permisos ya están en la sesión
    if (session.user.permisos && Array.isArray(session.user.permisos)) {
      return session.user.permisos.includes(permisoRequerido);
    }

    // Si no están en la sesión, buscarlos en la base de datos
    // Obtener el rol y sus permisos
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(session.user.id) },
      include: {
        rol: {
          include: {
            RolPermiso: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.rol) {
      if (res) {
        res.status(403).json({ error: 'No tiene un rol asignado.' });
      }
      return false;
    }

    // Extraer los permisos del rol
    const permisos = usuario.rol.RolPermiso?.map(rp => rp.permiso.nombre) || [];

    // Verificar si tiene el permiso requerido
    return permisos.includes(permisoRequerido);
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    if (res) {
      res.status(500).json({ error: 'Error al verificar permisos.' });
    }
    return false;
  }
}

/**
 * Verifica varios permisos (requiere tener TODOS)
 * @param permisosRequeridos Lista de permisos requeridos
 * @param req Objeto de solicitud
 * @param res Objeto de respuesta (opcional)
 * @returns true si tiene TODOS los permisos, false en caso contrario
 */
export async function requireAllPermisos(
  permisosRequeridos: string[],
  req: NextApiRequest | NextRequest,
  res?: NextApiResponse
): Promise<boolean> {
  if (!permisosRequeridos.length) return true;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      if (res) {
        res.status(401).json({ error: 'No autorizado. Inicie sesión para continuar.' });
      }
      return false;
    }

    // Verificar permisos en la sesión
    if (session.user.permisos && Array.isArray(session.user.permisos)) {
      return permisosRequeridos.every(p => session.user.permisos?.includes(p));
    }

    // Buscar permisos en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(session.user.id) },
      include: {
        rol: {
          include: {
            RolPermiso: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.rol) {
      if (res) {
        res.status(403).json({ error: 'No tiene un rol asignado.' });
      }
      return false;
    }

    const permisos = usuario.rol.RolPermiso?.map(rp => rp.permiso.nombre) || [];
    return permisosRequeridos.every(p => permisos.includes(p));
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    if (res) {
      res.status(500).json({ error: 'Error al verificar permisos.' });
    }
    return false;
  }
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos especificados
 * @param permisosRequeridos Lista de permisos requeridos
 * @param req Objeto de solicitud
 * @param res Objeto de respuesta (opcional)
 * @returns true si tiene AL MENOS UNO de los permisos, false en caso contrario
 */
export async function requireAnyPermiso(
  permisosRequeridos: string[],
  req: NextApiRequest | NextRequest,
  res?: NextApiResponse
): Promise<boolean> {
  if (!permisosRequeridos.length) return true;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      if (res) {
        res.status(401).json({ error: 'No autorizado. Inicie sesión para continuar.' });
      }
      return false;
    }

    // Verificar permisos en la sesión
    if (session.user.permisos && Array.isArray(session.user.permisos)) {
      return permisosRequeridos.some(p => session.user.permisos?.includes(p));
    }

    // Buscar permisos en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(session.user.id) },
      include: {
        rol: {
          include: {
            RolPermiso: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.rol) {
      if (res) {
        res.status(403).json({ error: 'No tiene un rol asignado.' });
      }
      return false;
    }

    const permisos = usuario.rol.RolPermiso?.map(rp => rp.permiso.nombre) || [];
    return permisosRequeridos.some(p => permisos.includes(p));
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    if (res) {
      res.status(500).json({ error: 'Error al verificar permisos.' });
    }
    return false;
  }
}

/**
 * Verifica si el usuario pertenece a la empresa especificada
 * @param idEmpresa ID de la empresa
 * @param req Objeto de solicitud
 * @param res Objeto de respuesta (opcional)
 * @returns true si pertenece a la empresa, false en caso contrario
 */
export async function requireEmpresa(
  idEmpresa: number,
  req: NextApiRequest | NextRequest,
  res?: NextApiResponse
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      if (res) {
        res.status(401).json({ error: 'No autorizado. Inicie sesión para continuar.' });
      }
      return false;
    }

    return session.user.id_empresa === idEmpresa;
  } catch (error) {
    console.error('Error al verificar empresa:', error);
    if (res) {
      res.status(500).json({ error: 'Error al verificar empresa.' });
    }
    return false;
  }
}

/**
 * Handler para envolver API routes con verificación de permisos
 * @param handler La función que maneja la solicitud
 * @param permiso El permiso requerido (o null si solo requiere autenticación)
 * @returns Handler envuelto con verificación de permisos
 */
export function withPermiso(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  permiso: string | null = null
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(authOptions);
      
      // Verificar autenticación
      if (!session || !session.user) {
        return res.status(401).json({ error: 'No autorizado. Inicie sesión para continuar.' });
      }

      // Si solo se requiere autenticación (sin permiso específico)
      if (!permiso) {
        return handler(req, res);
      }

      // Verificar permiso específico
      const tienePermiso = await requirePermiso(permiso, req, res);
      if (!tienePermiso) {
        return res.status(403).json({ 
          error: 'No tiene permiso para realizar esta acción.',
          permisoRequerido: permiso
        });
      }

      // Si tiene permiso, continuar con el handler
      return handler(req, res);
    } catch (error) {
      console.error('Error en withPermiso:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  };
} 