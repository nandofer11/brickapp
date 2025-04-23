import type { NextApiRequest, NextApiResponse } from "next"
import { connectDB } from "@/config/database"
import { Horno } from "@/models/Horno"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB()

  try {
    switch (req.method) {
      // case "GET":
      //   if (req.query.id_horno) {
      //     const horno = await Horno.findByPk(req.query.id_horno)
      //     if (!horno) {
      //       return res.status(404).json({ message: "Horno no encontrado" })
      //     }
      //     return res.status(200).json(horno)
      //   } else {
      //     const hornos = await Horno.findAll()
      //     return res.status(200).json(hornos)
      //   }

      case "POST":
        const nuevoHorno = await Horno.create(req.body)
        return res.status(201).json(nuevoHorno)

      case "PUT":
        if (!req.body.id_horno) {
          return res.status(400).json({ message: "ID de horno es requerido" })
        }

        const hornoExistente = await Horno.findByPk(req.body.id_horno)
        if (!hornoExistente) {
          return res.status(404).json({ message: "Horno no encontrado" })
        }

        await hornoExistente.update(req.body)
        return res.status(200).json(hornoExistente)

      // case "DELETE":
      //   if (!req.query.id_horno) {
      //     return res.status(400).json({ message: "ID de horno es requerido" })
      //   }

      //   const hornoEliminar = await Horno.findByPk(req.query.id_horno)
      //   if (!hornoEliminar) {
      //     return res.status(404).json({ message: "Horno no encontrado" })
      //   }

      //   await hornoEliminar.destroy()
      //   return res.status(200).json({ message: "Horno eliminado correctamente" })

      // default:
      //   return res.status(405).json({ message: "Método no permitido" })
    }
  } catch (error) {
    console.error("Error en API de hornos:", error)
    return res.status(500).json({ message: "Error interno del servidor" })
  }
}

