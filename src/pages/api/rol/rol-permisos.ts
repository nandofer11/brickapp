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

  // Obtener ID del rol
  const { id_rol } = req.query;
  
  if (!id_rol || Array.isArray(id_rol)) {
    return res.status(400).json({ message: "ID de rol inválido" });
  }
  
  // Convertir a número para usar con Prisma
  const rolId = parseInt(id_rol, 10);
  
  if (isNaN(rolId)) {
    return res.status(400).json({ message: "ID de rol debe ser un número válido" });
  }

  try {
    // Verificar que el rol existe
    const rol = await prisma.rol.findUnique({
      where: { id_rol: rolId }
    });
    
    if (!rol) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }
    
    // Verificar permisos: solo administradores o usuarios de la misma empresa
    const userEmpresaId = session.user?.id_empresa ? parseInt(session.user.id_empresa) : null;
    const esAdministrador = session.user?.rol === "ADMINISTRADOR";
    
    if (!esAdministrador && userEmpresaId !== rol.id_empresa) {
      return res.status(403).json({ 
        message: "No tienes permisos para acceder a información de este rol" 
      });
    }
    
    switch (req.method) {
      case "GET":
        // Obtener todos los permisos
        const todosPermisos = await prisma.permiso.findMany({
          orderBy: { nombre: 'asc' }
        });
        
        // Obtener permisos asignados al rol
        const permisosAsignados = await prisma.rol_permiso.findMany({
          where: { id_rol: rolId },
          include: {
            permiso: true
          }
        });
        
        // Mapear permisos asignados para una respuesta más simple
        const permisosDelRol = permisosAsignados.map(rp => ({
          id_permiso: rp.id_permiso,
          nombre: rp.permiso.nombre,
          descripcion: rp.permiso.descripcion,
          activo: rp.activo === 1
        }));
        
        // Crear lista completa con estado
        const listaCompleta = todosPermisos.map(p => {
          const asignado = permisosAsignados.find(rp => rp.id_permiso === p.id_permiso);
          return {
            id_permiso: p.id_permiso,
            nombre: p.nombre,
            descripcion: p.descripcion,
            asignado: !!asignado,
            activo: asignado ? asignado.activo === 1 : false
          };
        });
        
        return res.status(200).json({
          rol: {
            id_rol: rol.id_rol,
            nombre: rol.nombre,
            descripcion: rol.descripcion
          },
          permisos: permisosDelRol,
          todos_permisos: listaCompleta
        });
        
      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error(`Error al obtener permisos del rol ${id_rol}:`, error);
    return res.status(500).json({ 
      message: "Error interno del servidor", 
      error: error.message 
    });
  }
} 