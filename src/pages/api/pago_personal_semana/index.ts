import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import PagoPersonalSemanaService from "@/lib/services/PagoPersonalSemanaService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const id_empresa = Number(session.user?.id_empresa);
  if (!id_empresa) {
    return res.status(400).json({ message: "ID de empresa inválido" });
  }

  try {
    switch (req.method) {
      case "GET":
        // Buscar por rango de fechas
        if (req.query.fechaInicio && req.query.fechaFin) {
          const fechaInicio = req.query.fechaInicio as string;
          const fechaFin = req.query.fechaFin as string;
          const pagos = await PagoPersonalSemanaService.findByFechaRango(fechaInicio, fechaFin, id_empresa);
          return res.status(200).json(pagos);
        }
        // Añadir soporte para buscar por id_semana
        else if (req.query.id_semana) {
          const id_semana = parseInt(req.query.id_semana as string, 10);
          const pagos = await PagoPersonalSemanaService.findBySemanaLaboral(id_semana);
          return res.status(200).json(pagos);
        }
        else if (req.query.id) {
          const id = parseInt(req.query.id as string, 10);
          const pago = await PagoPersonalSemanaService.findById(id);
          return res.status(200).json(pago);
        }
        else {
          const pagos = await PagoPersonalSemanaService.findAllByEmpresa(id_empresa);
          return res.status(200).json(pagos);
        }

      case "POST":
        try {
          console.log("Datos recibidos en API:", req.body);
          
          // Verificar si es un pago a personal externo
          if (req.body.es_personal_externo) {
            // Usar el método específico para personal externo
            const nuevoPagoExterno = await PagoPersonalSemanaService.createPagoPersonalExterno(req.body);
            return res.status(201).json(nuevoPagoExterno);
          } else {
            // Pago normal a personal interno
            const nuevo = await PagoPersonalSemanaService.create(req.body);
            return res.status(201).json(nuevo);
          }
        } catch (error) {
          console.error("Error detallado al crear pago:", error);
          return res.status(400).json({ 
            message: error instanceof Error ? error.message : "Error al procesar el pago",
            details: error
          });
        }

      case "PUT":
        const idToUpdate = req.query.id
          ? parseInt(req.query.id as string, 10)
          : req.body.id_pago_personal_semana;

        if (!idToUpdate) {
          return res.status(400).json({ message: "ID requerido para actualizar" });
        }

        const actualizado = await PagoPersonalSemanaService.update(idToUpdate, req.body);
        return res.status(200).json(actualizado);

      case "PATCH":
        const idToPatch = parseInt(req.query.id as string, 10);
        if (!idToPatch) {
          return res.status(400).json({ message: "ID requerido para actualizar" });
        }

        const patchData = req.body;
        const updated = await PagoPersonalSemanaService.update(idToPatch, patchData);
        return res.status(200).json(updated);

      case "DELETE":
        const idToDelete = parseInt(req.query.id as string, 10);
        if (!idToDelete) {
          return res.status(400).json({ message: "ID requerido para eliminar" });
        }

        await PagoPersonalSemanaService.delete(idToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido`);
    }
  } catch (error) {
    console.error("Error en /api/pago_personal_semana:", error);
    return res.status(500).json({
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
}
