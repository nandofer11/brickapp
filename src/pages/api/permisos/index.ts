import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  try {
    if (req.method === "GET") {
      const { category } = req.query;

      if (category === 'grouped') {
        // Obtener permisos agrupados por categoría
        const permissions = await prisma.permiso.findMany({
          orderBy: { nombre: 'asc' }
        });

        const categories: Record<string, any[]> = {};
        permissions.forEach(permission => {
          const cat = permission.categoria || 'General';
          if (!categories[cat]) {
            categories[cat] = [];
          }
          categories[cat].push(permission);
        });

        return res.status(200).json(categories);
      }

      // Obtener todos los permisos
      const permissions = await prisma.permiso.findMany({
        orderBy: { nombre: 'asc' }
      });
      
      return res.status(200).json(permissions);
    }

    if (req.method === "POST") {
      const { nombre, codigo, descripcion, categoria } = req.body;

      // Validar campos requeridos
      if (!nombre || !codigo) {
        return res.status(400).json({ message: "Nombre y código son obligatorios" });
      }

      try {
        const permission = await prisma.permiso.create({
          data: {
            nombre,
            codigo,
            descripcion,
            categoria: categoria || 'General'
          }
        });
        
        return res.status(201).json(permission);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return res.status(409).json({ message: "Ya existe un permiso con este código o nombre" });
        }
        throw error;
      }
    }

    return res.status(405).json({ message: "Método no permitido" });
  } catch (error: any) {
    console.error("Error en API de permisos:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message 
    });
  }
}