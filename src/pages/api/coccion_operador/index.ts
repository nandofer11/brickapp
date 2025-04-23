import type { NextApiRequest, NextApiResponse } from "next"
import { connectDB } from "@/config/database"
import { CoccionOperador } from "@/models/CoccionOperador"
import { Personal } from "@/models/Personal"
import { CargoCocion } from "@/models/CargoCoccion"
import { Coccion } from "@/models/Coccion"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB()

  try {
    switch (req.method) {
      case "GET":
        if (req.query.id_coccion_operador) {
          const operador = await CoccionOperador.findByPk(req.query.id_coccion_operador, {
            include: [
              { model: Personal, as: "Personal" },
              { model: CargoCocion, as: "CargoCocion" },
              { model: Coccion, as: "Coccion" },
            ],
          })

          if (!operador) {
            return res.status(404).json({ message: "Operador de cocción no encontrado" })
          }

          return res.status(200).json(operador)
        } else if (req.query.coccion_id_coccion) {
          // Filtrar por cocción
          const operadores = await CoccionOperador.findAll({
            where: {
              coccion_id_coccion: req.query.coccion_id_coccion,
            },
            include: [
              { model: Personal, as: "Personal" },
              { model: CargoCocion, as: "CargoCocion" },
            ],
          })

          return res.status(200).json(operadores)
        } else {
          const operadores = await CoccionOperador.findAll({
            include: [
              { model: Personal, as: "Personal" },
              { model: CargoCocion, as: "CargoCocion" },
              { model: Coccion, as: "Coccion" },
            ],
          })

          return res.status(200).json(operadores)
        }

      case "POST":
        // Puede ser un solo operador o un array de operadores
        if (Array.isArray(req.body)) {
          const nuevosOperadores = await CoccionOperador.bulkCreate(req.body)
          return res.status(201).json(nuevosOperadores)
        } else {
          const nuevoOperador = await CoccionOperador.create(req.body)
          return res.status(201).json(nuevoOperador)
        }

      case "PUT":
        if (!req.body.id_coccion_operador) {
          return res.status(400).json({ message: "ID de operador es requerido" })
        }

        const operadorExistente = await CoccionOperador.findByPk(req.body.id_coccion_operador)
        if (!operadorExistente) {
          return res.status(404).json({ message: "Operador de cocción no encontrado" })
        }

        await operadorExistente.update(req.body)
        return res.status(200).json(operadorExistente)

      case "DELETE":
        if (req.query.id_coccion_operador) {
          // Eliminar un operador específico
          const operadorEliminar = await CoccionOperador.findByPk(req.query.id_coccion_operador)
          if (!operadorEliminar) {
            return res.status(404).json({ message: "Operador de cocción no encontrado" })
          }

          await operadorEliminar.destroy()
          return res.status(200).json({ message: "Operador de cocción eliminado correctamente" })
        } else if (req.query.coccion_id_coccion) {
          // Eliminar todos los operadores de una cocción
          await CoccionOperador.destroy({
            where: {
              coccion_id_coccion: req.query.coccion_id_coccion,
            },
          })

          return res.status(200).json({ message: "Operadores de cocción eliminados correctamente" })
        } else {
          return res.status(400).json({ message: "ID de operador o ID de cocción es requerido" })
        }

      default:
        return res.status(405).json({ message: "Método no permitido" })
    }
  } catch (error) {
    console.error("Error en API de operadores de cocción:", error)
    return res.status(500).json({ message: "Error interno del servidor" })
  }
}

