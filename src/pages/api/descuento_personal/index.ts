import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import DescuentoPersonalService from "@/lib/services/DescuentoPersonalService";

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
          const descuento = await DescuentoPersonalService.findById(id);
          return res.status(200).json(descuento);
        } else if (req.query.id_personal && req.query.fecha_inicio && req.query.fecha_fin) {
          // Buscar por personal y rango de fechas
          const idPersonal = parseInt(req.query.id_personal as string, 10);
          const fechaInicio = new Date(req.query.fecha_inicio as string);
          const fechaFin = new Date(req.query.fecha_fin as string);
          const descuentos = await DescuentoPersonalService.findByPersonalAndFecha(idPersonal, fechaInicio, fechaFin);
          return res.status(200).json(descuentos);
        } else {
          const descuentos = await DescuentoPersonalService.findAllByEmpresa(id_empresa);
          return res.status(200).json(descuentos);
        }

      case "POST":
        const creado = await DescuentoPersonalService.createDescuento({
          ...req.body,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return res.status(201).json(creado);

      case "PUT":
        const idToUpdate = req.query.id
          ? parseInt(req.query.id as string, 10)
          : req.body.id_descuento_personal;

        if (!idToUpdate) {
          return res.status(400).json({ message: "ID es requerido para actualizar." });
        }

        const actualizado = await DescuentoPersonalService.updateDescuento(idToUpdate, {
          ...req.body,
          updated_at: new Date(),
        });
        return res.status(200).json(actualizado);

      case "DELETE":
        const idToDelete = parseInt(req.query.id as string, 10);
        if (!idToDelete) {
          return res.status(400).json({ message: "ID es requerido para eliminar." });
        }

        await DescuentoPersonalService.deleteDescuento(idToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/descuento_personal:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
