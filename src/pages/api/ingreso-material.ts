import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  const id_empresa = Number(session.user?.id_empresa);
  const id_usuario = Number(session.user?.id);

  if (!id_empresa) {
    return res.status(400).json({ message: "ID de empresa inválido o no encontrado en la sesión" });
  }

  if (!id_usuario) {
    return res.status(400).json({ message: "ID de usuario inválido o no encontrado en la sesión" });
  }

  try {
    switch (req.method) {
      case "GET":
        // Obtener todos los ingresos de material de la empresa
        const ingresosMaterial = await prisma.ingreso_material.findMany({
          where: {
            id_empresa: id_empresa
          },
          include: {
            proveedor: true,
            usuario: true
          },
          orderBy: {
            fecha_ingreso: 'desc'
          }
        });
        
        return res.status(200).json(ingresosMaterial);

      case "POST":
        const { material, id_proveedor, fecha_ingreso, cantidad, precio_unitario, observaciones } = req.body;

        // Validaciones
        if (!material || !fecha_ingreso || !cantidad) {
          return res.status(400).json({ 
            message: "Los campos material, fecha_ingreso y cantidad son obligatorios" 
          });
        }

        // Validar que el tipo de material sea válido
        const tiposValidos = ['CASCARILLA', 'ARCILLA'];
        const tipoMaterial = material.toUpperCase();
        
        if (!tiposValidos.includes(tipoMaterial)) {
          return res.status(400).json({ 
            message: "Tipo de material inválido. Debe ser CASCARILLA o ARCILLA" 
          });
        }

        // No calculamos el total aquí porque es una columna generada en la BD

        // Crear el registro de ingreso de material
        const nuevoIngreso = await prisma.ingreso_material.create({
          data: {
            tipo_material: tipoMaterial as any,
            id_proveedor: id_proveedor ? Number(id_proveedor) : null,
            id_usuario: id_usuario,
            id_empresa: id_empresa,
            fecha_ingreso: new Date(fecha_ingreso),
            cantidad: Number(cantidad),
            precio_unitario: precio_unitario ? Number(precio_unitario) : null,
            // No incluimos 'total' porque es una columna generada
            observaciones: observaciones || null,
            created_at: new Date(),
            updated_at: new Date()
          },
          include: {
            proveedor: true,
            usuario: true
          }
        });

        return res.status(201).json(nuevoIngreso);

      case "PUT":
        const { id } = req.query;
        const updateData = req.body;

        if (!id) {
          return res.status(400).json({ message: "ID del ingreso de material es requerido" });
        }

        // Verificar que el ingreso pertenece a la empresa
        const ingresoExistente = await prisma.ingreso_material.findFirst({
          where: {
            id_ingreso_material: Number(id),
            id_empresa: id_empresa
          }
        });

        if (!ingresoExistente) {
          return res.status(404).json({ message: "Ingreso de material no encontrado" });
        }

        // Excluir 'total' del updateData porque es una columna generada
        const { total: _, ...dataToUpdate } = updateData;

        const ingresoActualizado = await prisma.ingreso_material.update({
          where: {
            id_ingreso_material: Number(id)
          },
          data: {
            ...dataToUpdate,
            updated_at: new Date()
          },
          include: {
            proveedor: true,
            usuario: true
          }
        });

        return res.status(200).json(ingresoActualizado);

      case "DELETE":
        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ message: "ID del ingreso de material es requerido" });
        }

        // Verificar que el ingreso pertenece a la empresa
        const ingresoAEliminar = await prisma.ingreso_material.findFirst({
          where: {
            id_ingreso_material: Number(deleteId),
            id_empresa: id_empresa
          }
        });

        if (!ingresoAEliminar) {
          return res.status(404).json({ message: "Ingreso de material no encontrado" });
        }

        await prisma.ingreso_material.delete({
          where: {
            id_ingreso_material: Number(deleteId)
          }
        });

        return res.status(200).json({ message: "Ingreso de material eliminado exitosamente" });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error("Error en API ingreso-material:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor", 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
}