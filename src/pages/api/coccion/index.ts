import type { NextApiRequest, NextApiResponse } from "next"
import { connectDB } from "@/config/database"
import { Coccion } from "@/models/Coccion"
import { Horno } from "@/models/Horno"
import { SemanaTrabajo } from "@/models/SemanaTrabajo"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB()

  try {
    switch (req.method) {
      case "GET":
        if (req.query.id_coccion) {
          const coccion = await Coccion.findByPk(req.query.id_coccion, {
            include: [
              { model: Horno, as: "Horno" },
              { model: SemanaTrabajo, as: "SemanaTrabajo" },
            ],
          })

          if (!coccion) {
            return res.status(404).json({ message: "Cocción no encontrada" })
          }

          return res.status(200).json(coccion)
        } else if (req.query.semana_trabajo_id_semana_trabajo) {
          // Filtrar por semana laboral
          const cocciones = await Coccion.findAll({
            where: {
              semana_trabajo_id_semana_trabajo: req.query.semana_trabajo_id_semana_trabajo,
            },
            include: [
              { model: Horno, as: "Horno" },
              { model: SemanaTrabajo, as: "SemanaTrabajo" },
            ],
          })

          return res.status(200).json(cocciones)
        } else {
          const cocciones = await Coccion.findAll({
            include: [
              { model: Horno, as: "Horno" },
              { model: SemanaTrabajo, as: "SemanaTrabajo" },
            ],
          })

          return res.status(200).json(cocciones)
        }

      case "POST":
        const nuevaCoccion = await Coccion.create(req.body)
        return res.status(201).json(nuevaCoccion)

      case "PUT":
        if (!req.body.id_coccion) {
          return res.status(400).json({ message: "ID de cocción es requerido" })
        }

        const coccionExistente = await Coccion.findByPk(req.body.id_coccion)
        if (!coccionExistente) {
          return res.status(404).json({ message: "Cocción no encontrada" })
        }

        await coccionExistente.update(req.body)
        return res.status(200).json(coccionExistente)

      case "DELETE":
        if (!req.query.id_coccion) {
          return res.status(400).json({ message: "ID de cocción es requerido" })
        }

        const coccionEliminar = await Coccion.findByPk(req.query.id_coccion)
        if (!coccionEliminar) {
          return res.status(404).json({ message: "Cocción no encontrada" })
        }

        await coccionEliminar.destroy()
        return res.status(200).json({ message: "Cocción eliminada correctamente" })

      default:
        return res.status(405).json({ message: "Método no permitido" })
    }
  } catch (error) {
    console.error("Error en API de cocción:", error)
    return res.status(500).json({ message: "Error interno del servidor" })
  }
}

