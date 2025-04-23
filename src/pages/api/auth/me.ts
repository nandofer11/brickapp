import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Solo permitimos método GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Obtener la sesión actual
    const session = await getServerSession(req, res, authOptions);
    
    // Si no hay sesión, devolver error
    if (!session || !session.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Buscar el usuario en la base de datos con su rol y permisos
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: Number(session.user.id) },
      include: {
        rol: {
          select: {
            id_rol: true,
            nombre: true,
            descripcion: true,
            RolPermiso: {
              select: {
                permiso: {
                  select: {
                    id_permiso: true,
                    nombre: true,
                    descripcion: true
                  }
                }
              }
            }
          }
        },
        empresa: {
          select: {
            id_empresa: true,
            razon_social: true,
            rfc: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Extraer los permisos
    const permisos = usuario.rol?.RolPermiso?.map(rp => rp.permiso.nombre) || [];
    
    // Formatear respuesta
    const userData = {
      id: usuario.id_usuario,
      name: usuario.nombre_completo,
      email: usuario.email,
      id_empresa: usuario.id_empresa,
      id_rol: usuario.id_rol,
      rol: usuario.rol?.nombre,
      empresa: usuario.empresa?.razon_social,
      permisos: permisos
    };

    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 