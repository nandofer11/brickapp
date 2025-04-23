import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticación
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: "No autorizado" });
  }

  // Verificar si es administrador
  const esAdministrador = session.user?.rol === "ADMINISTRADOR";
  if (!esAdministrador) {
    return res.status(403).json({ 
      message: "No tienes permisos para gestionar permisos de roles" 
    });
  }

  try {
    switch (req.method) {
      case "GET":
        // Obtener todos los permisos
        const permisos = await prisma.permiso.findMany({
          orderBy: { nombre: 'asc' }
        });
        return res.status(200).json(permisos);
        
      case "POST":
        // Asignar permisos a un rol
        const { id_rol, permisos: permisosAsignar } = req.body;

        if (!id_rol) {
          return res.status(400).json({ message: "El ID del rol es obligatorio" });
        }

        if (!Array.isArray(permisosAsignar)) {
          return res.status(400).json({ message: "Los permisos deben ser un arreglo" });
        }

        // Verificar que el rol existe
        const rol = await prisma.rol.findUnique({
          where: { id_rol: Number(id_rol) },
          include: {
            empresa: true
          }
        });

        if (!rol) {
          return res.status(404).json({ message: "Rol no encontrado" });
        }

        // Verificar que el usuario tiene acceso a la empresa del rol
        const userEmpresaId = session.user?.id_empresa ? parseInt(session.user.id_empresa) : null;
        if (!esAdministrador && userEmpresaId !== rol.id_empresa) {
          return res.status(403).json({ 
            message: "No tienes permisos para gestionar roles de esta empresa" 
          });
        }

        // Eliminar permisos actuales
        await prisma.rol_permiso.deleteMany({
          where: { id_rol: Number(id_rol) }
        });

        // Crear nuevos permisos
        const createdPermisos = [];
        
        for (const permisoId of permisosAsignar) {
          const rolPermiso = await prisma.rol_permiso.create({
            data: {
              id_rol: Number(id_rol),
              id_permiso: Number(permisoId),
              activo: 1
            }
          });
          createdPermisos.push(rolPermiso);
        }

        return res.status(200).json({
          message: "Permisos asignados correctamente",
          data: createdPermisos
        });

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error("Error en gestión de permisos:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor", 
      error: error.message 
    });
  }
} 