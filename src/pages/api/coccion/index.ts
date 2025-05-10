import { NextApiRequest, NextApiResponse } from "next";
import { CoccionService } from "@/lib/services/CoccionService";
import { CoccionPersonalService } from "@/lib/services/CoccionPersonalService";

const coccionService = new CoccionService();
const coccionOperadorService = new CoccionPersonalService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      try {
        const { id } = req.query;
        if (id) {
          const coccion = await coccionService.findById(Number(id));
          return coccion 
            ? res.status(200).json(coccion)
            : res.status(404).json({ message: "Cocción no encontrada" });
        }
        const cocciones = await coccionService.findAllByEmpresa(Number(req.query.id_empresa));
        return res.status(200).json(cocciones);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

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
