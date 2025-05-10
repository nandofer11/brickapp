import { NextApiRequest, NextApiResponse } from "next";
import { CoccionService } from "@/lib/services/CoccionService";
import { CoccionPersonalService } from "@/lib/services/CoccionPersonalService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coccionService = new CoccionService();
const coccionOperadorService = new CoccionPersonalService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { id_coccion, include_relations, include_personal } = query;
        let result;

        if (id_coccion) {
          // Obtener una cocción específica con sus operadores
          result = await prisma.coccion.findUnique({
            where: { id_coccion: Number(id_coccion) },
            include: {
              horno: true,
              semana_laboral: true,
              coccion_personal: include_personal ? {
                include: {
                  personal: true,
                  cargo_coccion: true
                }
              } : false
            }
          });
        } else {
          // Obtener todas las cocciones con relaciones si se solicita
          result = await prisma.coccion.findMany({
            include: include_relations ? {
              horno: true,
              semana_laboral: true
            } : undefined
          });
        }

        res.status(200).json(result);
      } catch (error) {
        console.error('Error en GET /api/coccion:', error);
        res.status(500).json({ error: 'Error al obtener datos de cocción' });
      }
      break;

    case "POST":
      try {
        const { coccion, operadores } = req.body;
        
        // Validar campos obligatorios
        if (!coccion.semana_trabajo_id_semana_trabajo || 
            !coccion.horno_id_horno || 
            !coccion.fecha_encendido) {
          return res.status(400).json({ 
            message: "Los campos semana_trabajo_id_semana_trabajo, horno_id_horno y fecha_encendido son obligatorios" 
          });
        }

        const coccionData = {
          ...coccion,
          semana_laboral_id_semana_laboral: coccion.semana_trabajo_id_semana_trabajo,
          fecha_encendido: new Date(coccion.fecha_encendido),
        };
        delete coccionData.semana_trabajo_id_semana_trabajo;

        const result = await coccionService.createCoccionWithOperadores(coccionData, operadores);
        return res.status(201).json(result);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      try {
        const { id } = req.query;
        const { coccion, operadores } = req.body;

        // Validar campos obligatorios de cocción
        if (!coccion.semana_trabajo_id_semana_trabajo || 
            !coccion.horno_id_horno || 
            !coccion.fecha_encendido) {
          return res.status(400).json({ 
            message: "Los campos semana_trabajo_id_semana_trabajo, horno_id_horno y fecha_encendido son obligatorios" 
          });
        }

        // Mapear los campos al formato correcto para Prisma
        const coccionData = {
          ...coccion,
          semana_laboral_id_semana_laboral: coccion.semana_trabajo_id_semana_trabajo,
          fecha_encendido: new Date(coccion.fecha_encendido),
        };
        
        // Eliminar el campo incorrecto
        delete coccionData.semana_trabajo_id_semana_trabajo;

        // Validar operadores si se proporcionan
        if (operadores?.length) {
          const operadoresInvalidos = operadores.some((op: any) => 
            !op.personal_id_personal || !op.cargo_coccion_id_cargo_coccion
          );

          if (operadoresInvalidos) {
            return res.status(400).json({ 
              message: "Cada operador debe tener personal_id_personal y cargo_coccion_id_cargo_coccion" 
            });
          }
        }

        const coccionActualizada = await coccionService.updateCoccion(Number(id), coccionData);
        
        if (operadores?.length) {
          await coccionOperadorService.deleteCoccionPersonal(Number(id));
          await coccionOperadorService.createManyCoccionPersonal(operadores.map((op: any) => ({
            personal_id_personal: op.personal_id_personal,
            cargo_coccion_id_cargo_coccion: op.cargo_coccion_id_cargo_coccion,
            coccion_id_coccion: Number(id)
          })));
        }
        
        return res.status(200).json(coccionActualizada);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    case "DELETE":
      try {
        const { id } = req.query;
        await coccionService.deleteCoccion(Number(id), Number(req.query.id_empresa));
        return res.status(204).end();
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
