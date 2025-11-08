import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  const { rolId } = req.query;
  const roleId = parseInt(rolId as string);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: "ID de rol inválido" });
  }

  try {
    if (req.method === "GET") {
      // Obtener un rol específico con sus permisos
      const roleWithPermissions = await prisma.rol.findUnique({
        where: { id_rol: roleId },
        include: {
          rol_permiso: {
            include: {
              permiso: true
            }
          }
        }
      });
      
      if (!roleWithPermissions) {
        return res.status(404).json({ message: "Rol no encontrado" });
      }

      return res.status(200).json(roleWithPermissions);
    }

    if (req.method === "PUT") {
      const { permisoIds } = req.body;

      // Validar que permisoIds sea un array
      if (!Array.isArray(permisoIds)) {
        return res.status(400).json({ message: "permisoIds debe ser un array" });
      }

      // Validar que todos los elementos sean números
      const validIds = permisoIds.every(id => Number.isInteger(id) && id > 0);
      if (!validIds) {
        return res.status(400).json({ message: "Todos los IDs de permisos deben ser números enteros positivos" });
      }

      try {
        // Asignar múltiples permisos a un rol (reemplazar permisos existentes)
        await prisma.$transaction(async (tx) => {
          // Eliminar permisos existentes
          await tx.rol_permiso.deleteMany({
            where: { id_rol: roleId }
          });

          // Asignar nuevos permisos
          if (permisoIds.length > 0) {
            await tx.rol_permiso.createMany({
              data: permisoIds.map(permisoId => ({
                id_rol: roleId,
                id_permiso: permisoId,
                activo: 1
              }))
            });
          }
        });
        
        // Obtener y retornar el rol actualizado
        const updatedRole = await prisma.rol.findUnique({
          where: { id_rol: roleId },
          include: {
            rol_permiso: {
              include: {
                permiso: true
              }
            }
          }
        });
        
        return res.status(200).json(updatedRole);
      } catch (error: any) {
        if (error.code === 'P2025') {
          return res.status(404).json({ message: "Rol no encontrado" });
        }
        throw error;
      }
    }

    return res.status(405).json({ message: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API de rol con permisos:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message 
    });
  }
}