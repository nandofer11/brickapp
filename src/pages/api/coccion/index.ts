import { NextApiRequest, NextApiResponse } from "next";
import { CoccionService } from "@/lib/services/CoccionService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coccionService = new CoccionService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { id_coccion, include_relations, include_personal, include_complete, id_semana_laboral } = query;

        // Si se solicita filtrar por semana laboral
        if (id_semana_laboral) {
          const coccionesPorSemana = await prisma.coccion.findMany({
            where: {
              semana_laboral_id_semana_laboral: Number(id_semana_laboral)
            },
            include: {
              semana_laboral: {
                select: {
                  id_semana_laboral: true,
                  fecha_inicio: true,
                  fecha_fin: true,
                  estado: true
                }
              },
            }
          });

          return res.status(200).json(coccionesPorSemana);
        }

        // Si se solicita la información completa de la cocción
        if (id_coccion && include_complete === 'true') {
          const coccionCompleta = await prisma.coccion.findUnique({
            where: {
              id_coccion: Number(id_coccion)
            },
            include: {
              semana_laboral: {
                select: {
                  id_semana_laboral: true,
                  fecha_inicio: true,
                  fecha_fin: true,
                  estado: true
                }
              },
            }
          });

          if (!coccionCompleta) {
            return res.status(404).json({ message: 'Cocción no encontrada' });
          }

          return res.status(200).json(coccionCompleta);
        }

        // Si se solicita cocción con relaciones (mantener para compatibilidad)
        if (id_coccion && include_relations === 'true') {
          const data = await coccionService.findByIdComplete(Number(id_coccion));
          return res.status(200).json(data);
        }

        // Si solo se solicita la cocción (mantener para compatibilidad)
        if (id_coccion) {
          const coccion = await prisma.coccion.findUnique({
            where: { id_coccion: Number(id_coccion) },
            include: {
              horno: true,
              semana_laboral: true,
            }
          });
          return res.status(200).json(coccion);
        }

        // Listar todas las cocciones (mantener igual)
        const cocciones = await prisma.coccion.findMany({
          where: {
            id_empresa: req.query.id_empresa as unknown as number
          },
          include: {
            horno: true,
            semana_laboral: true
          },
          orderBy: {
            id_coccion: 'desc'
          }
        });
        return res.status(200).json(cocciones);
      } catch (error) {
        console.error('Error en GET coccion:', error);
        return res.status(500).json({ message: 'Error al obtener datos' });
      }
    case "POST":
      try {
        const coccionData = req.body;

        // Validar campos obligatorios
        if (!coccionData.semana_laboral_id_semana_laboral ||
          !coccionData.horno_id_horno ||
          !coccionData.fecha_encendido) {
          return res.status(400).json({
            message: "Los campos semana_laboral_id_semana_laboral, horno_id_horno y fecha_encendido son obligatorios"
          });
        }

        // Convertir la fecha a objeto Date para formato ISO
        coccionData.fecha_encendido = new Date(coccionData.fecha_encendido);

        const result = await coccionService.createCoccion(coccionData);
        return res.status(201).json(result);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      try {
        // Versión modificada - Obtener id_coccion directamente del cuerpo
        const id_coccion = Number(req.body.id_coccion);
        if (!id_coccion || isNaN(id_coccion)) {
          res.status(400).json({ message: "id_coccion es requerido y debe ser un número válido" });
          return;
        }

        // Extraer el id_coccion para usarlo en el where de Prisma, pero no incluirlo en los datos
        const { id_coccion: _, ...dataToUpdate } = req.body;

        // Validar campos obligatorios
        if (!dataToUpdate.semana_laboral_id_semana_laboral ||
          !dataToUpdate.horno_id_horno ||
          !dataToUpdate.fecha_encendido) {
          return res.status(400).json({
            message: "Los campos semana_trabajo_id_semana_trabajo, horno_id_horno y fecha_encendido son obligatorios"
          });
        }

        // Convertir fechas de string a objeto Date para formato ISO
        if (dataToUpdate.fecha_encendido && typeof dataToUpdate.fecha_encendido === 'string') {
          dataToUpdate.fecha_encendido = new Date(dataToUpdate.fecha_encendido);
        }

        if (dataToUpdate.fecha_apagado && typeof dataToUpdate.fecha_apagado === 'string') {
          dataToUpdate.fecha_apagado = new Date(dataToUpdate.fecha_apagado);
        }

        // Mapear los campos al formato correcto para Prisma
        if (dataToUpdate.semana_labora_id_semana_laboral) {
          dataToUpdate.semana_laboral_id_semana_laboral = dataToUpdate.semana_laboral_id_semana_laboral;
          delete dataToUpdate.semana_laboral_id_semana_laboral;
        }

        // Llama al servicio con el objeto limpio
        const result = await coccionService.updateCoccion(id_coccion, dataToUpdate);

        res.status(200).json(result);
        return;
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    case "DELETE":
      try {
        const id_coccion = Number(req.query.id_coccion);

        if (!id_coccion || isNaN(id_coccion)) {
          return res.status(400).json({ message: "ID de cocción inválido" });
        }

        const result = await coccionService.deleteCoccionCompleta(id_coccion);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error al eliminar:', error);
        return res.status(500).json({
          message: error instanceof Error ? error.message : "Error al eliminar cocción"
        });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
