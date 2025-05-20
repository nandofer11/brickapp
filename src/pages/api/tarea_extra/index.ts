import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import TareaExtraService from "@/lib/services/TareaExtraService";

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
