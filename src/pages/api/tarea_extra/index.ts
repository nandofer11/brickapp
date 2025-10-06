import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import TareaExtraService from "@/lib/services/TareaExtraService";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  const id_empresa = Number(session.user?.id_empresa);
  if (!id_empresa) {
    return res.status(400).json({ message: "ID de empresa inválido o no encontrado en la sesión" });
  }

  try {
    switch (req.method) {
      case "GET":
        if (req.query.id) {
          const id = parseInt(req.query.id as string, 10);
          const tarea = await TareaExtraService.findById(id);
          return res.status(200).json(tarea);
        } else if (req.query.id_semana) {
          // Filtrar por semana laboral
          const idSemana = parseInt(req.query.id_semana as string, 10);
          
          const tareasPorSemana = await prisma.tarea_extra.findMany({
            where: {
              id_semana_laboral: idSemana,
              personal: {
                id_empresa: id_empresa
              }
            },
            include: {
              personal: true,
              semana_laboral: true
            },
            orderBy: {
              fecha: 'desc'
            }
          });
          
          return res.status(200).json(tareasPorSemana);
        } else if (req.query.fechaInicio && req.query.fechaFin) {
          // Filtrar por rango de fechas
          const fechaInicio = new Date(req.query.fechaInicio as string);
          const fechaFin = new Date(req.query.fechaFin as string);
          // Ajustar fecha fin para incluir todo el día
          fechaFin.setHours(23, 59, 59, 999);
          
          // Obtener tareas extras filtradas por fecha
          const tareasPorFecha = await prisma.tarea_extra.findMany({
            where: {
              fecha: {
                gte: fechaInicio,
                lte: fechaFin
              },
              personal: {
                id_empresa: id_empresa
              }
            },
            include: {
              personal: true,
              semana_laboral: true
            },
            orderBy: {
              fecha: 'desc'
            }
          });
          
          return res.status(200).json(tareasPorFecha);
        } else {
          const tareas = await TareaExtraService.findAllByEmpresa(id_empresa);
          return res.status(200).json(tareas);
        }

      case "POST":
        const body = req.body;

        if (Array.isArray(body)) {
          // Registrar tarea para múltiples personales
          const dataArray = body.map((t) => ({
            ...t,
            created_at: new Date(),
            updated_at: new Date(),
          }));
          const created = await TareaExtraService.createManyTareaExtra(dataArray);
          return res.status(201).json(created);
        } else {
          // Registrar tarea para un solo personal
          const created = await TareaExtraService.createTareaExtra({
            ...body,
            created_at: new Date(),
            updated_at: new Date(),
          });
          return res.status(201).json(created);
        }

      case "PUT":
        const idToUpdate = req.query.id
          ? parseInt(req.query.id as string, 10)
          : req.body.id_tarea_extra;

        if (!idToUpdate) {
          return res.status(400).json({ message: "ID es requerido para actualizar." });
        }

        const updated = await TareaExtraService.updateTareaExtra(idToUpdate, {
          ...req.body,
          updated_at: new Date(),
        });

        return res.status(200).json(updated);

      case "DELETE":
        const idToDelete = parseInt(req.query.id as string, 10);
        if (!idToDelete) {
          return res.status(400).json({ message: "ID es requerido para eliminar." });
        }

        await TareaExtraService.deleteTareaExtra(idToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/tarea_extra:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
