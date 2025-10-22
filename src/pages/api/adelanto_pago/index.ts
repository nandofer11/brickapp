import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import AdelantoPagoService from "@/lib/services/AdelantoPagoService";

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
          const adelanto = await AdelantoPagoService.findById(id);
          return res.status(200).json(adelanto);
        } else if (req.query.id_semana) {
          // Buscar por semana laboral
          const idSemana = parseInt(req.query.id_semana as string, 10);
          const adelantos = await AdelantoPagoService.findBySemanaLaboral(idSemana);
          return res.status(200).json(adelantos);
        } else if (req.query.id_personal && req.query.fecha_inicio && req.query.fecha_fin) {
          // Buscar por personal y rango de fechas
          const idPersonal = parseInt(req.query.id_personal as string, 10);
          const fechaInicio = new Date(req.query.fecha_inicio as string);
          const fechaFin = new Date(req.query.fecha_fin as string);
          const estado = req.query.estado as string | undefined;
          
          const adelantos = await AdelantoPagoService.findByPersonalAndFecha(
            idPersonal, 
            fechaInicio, 
            fechaFin,
            estado
          );
          return res.status(200).json(adelantos);
        } else {
          const adelantos = await AdelantoPagoService.findAllByEmpresa(id_empresa);
          return res.status(200).json(adelantos);
        }

      case "POST":
        const { comentario, ...restBody } = req.body;
        const newAdelanto = await AdelantoPagoService.createAdelanto({
          ...restBody,
          comentario: comentario, // Mapear descripcion a comentario
          created_at: new Date(),
          updated_at: new Date(),
        });
        return res.status(201).json(newAdelanto);

       case "PUT":
        const idToUpdate = req.query.id
          ? parseInt(req.query.id as string, 10)
          : req.body.id_adelanto_pago;

        if (!idToUpdate) {
          return res.status(400).json({ message: "ID es requerido para actualizar." });
        }

        const { id_adelanto_pago, descripcion, ...validUpdateData } = req.body;
        const updated = await AdelantoPagoService.updateAdelanto(idToUpdate, {
          ...validUpdateData,
          comentario: descripcion, // Mapear descripcion a comentario
          updated_at: new Date(),
        });
        return res.status(200).json(updated);


      case "PATCH":
        // Añadir soporte explícito para PATCH para actualizaciones parciales
        const idToPatch = parseInt(req.query.id as string, 10);
        if (!idToPatch) {
          return res.status(400).json({ message: "ID es requerido para actualizar parcialmente." });
        }

        console.log(`Actualizando parcialmente adelanto ${idToPatch} con datos:`, req.body);

        // Actualizar solo los campos proporcionados
        const patchResult = await AdelantoPagoService.updateAdelanto(idToPatch, {
          ...req.body,
          updated_at: new Date(),
        });

        return res.status(200).json(patchResult);

      case "DELETE":
        const adelantoToDelete = parseInt(req.query.id as string, 10);
        console.log("adelantoToDelete", adelantoToDelete);
        if (!adelantoToDelete) {
          return res.status(400).json({ message: "ID es requerido para eliminar." });
        }

        await AdelantoPagoService.deleteAdelanto(adelantoToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "PATCH", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/adelanto_pago:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
}
