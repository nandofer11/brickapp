import type { NextApiRequest, NextApiResponse } from "next"
import { connectDB } from "@/config/database"
import { CargoCocion } from "@/models/CargoCoccion"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await connectDB()

    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) return res.status(401).json({ message: "No autorizado" });

        switch (req.method) {
            case "GET":
                const cargos = await CargoCocion.findAll()
                return res.status(200).json(cargos)

            case "POST":
                const nuevoCargo = await CargoCocion.create(req.body)
                return res.status(201).json(nuevoCargo)

            case "PUT":
                if (!req.body.id_cargo_coccion) {
                    return res.status(400).json({ message: "ID de cargo es requerido" })
                }

                const cargoExistente = await CargoCocion.findByPk(req.body.id_cargo_coccion)
                if (!cargoExistente) {
                    return res.status(404).json({ message: "Cargo de cocción no encontrado" })
                }

                await cargoExistente.update(req.body)
                return res.status(200).json(cargoExistente)

            case "DELETE":
                if (!req.query.id_cargo_coccion) {
                    return res.status(400).json({ message: "ID de cargo es requerido" })
                }

                const cargoEliminar = await CargoCocion.findOne({ where: { id_cargo_coccion: req.query.id_cargo_coccion } })
                if (!cargoEliminar) {
                    return res.status(404).json({ message: "Cargo de cocción no encontrado" })
                }

                await cargoEliminar.destroy()
                return res.status(200).json({ message: "Cargo de cocción eliminado correctamente" })

            default:
                return res.status(405).json({ message: "Método no permitido" })
        }
    } catch (error) {
        console.error("Error en API de cargos de cocción:", error)
        return res.status(500).json({ message: "Error interno del servidor" })
    }
}

