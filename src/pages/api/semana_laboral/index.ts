import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "@/config/database";
import { SemanaTrabajo } from "@/models/SemanaTrabajo";
import { Asistencia } from "@/models/Asistencia"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  try {

    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: "No autorizado" });

    const id_empresa = session.user.id_empresa; //id de la empresa del usuario

    switch (req.method) {
      case "GET":
        const semanas = await SemanaTrabajo.findAll({ where: { id_empresa } });
        return res.status(200).json(semanas);

      case "POST":
        const { fecha_inicio, fecha_fin, estado} = req.body;

        if (!fecha_inicio || !fecha_fin || !estado || !id_empresa) {
          return res.status(400).json({ message: "Faltan datos obligatorios." });
        }

        const nuevaSemana = await SemanaTrabajo.create({ fecha_inicio, fecha_fin, estado, id_empresa });
        return res.status(201).json(nuevaSemana);

      case "PUT":
        // Actualizar asistencias existentes
        if (!Array.isArray(req.body)) {
          return res.status(400).json({ message: "Se espera un array de asistencias." })
        }

        // Verificar que cada objeto tenga id_asistencia
        for (const asistencia of req.body) {
          if (!asistencia.id_asistencia) {
            return res.status(400).json({ message: "El ID de asistencia es obligatorio." })
          }
        }

        // Actualizar cada asistencia individualmente
        const actualizaciones = await Promise.all(
          req.body.map(async (asistencia) => {
            const { id_asistencia, ...datos } = asistencia
            const asistenciaExistente = await Asistencia.findByPk(id_asistencia)

            if (!asistenciaExistente) {
              return { id: id_asistencia, success: false, message: "Asistencia no encontrada" }
            }

            await asistenciaExistente.update(datos)
            return { id: id_asistencia, success: true }
          }),
        )

        return res.status(200).json({
          message: "Asistencias actualizadas correctamente",
          resultados: actualizaciones,
        })

      case "DELETE":
        const { id_semana_trabajo: idEliminar } = req.body;

        if (!idEliminar) {
          return res.status(400).json({ message: "El ID de la semana es obligatorio." });
        }

        const semanaEliminar = await SemanaTrabajo.findByPk(idEliminar);
        if (!semanaEliminar) {
          return res.status(404).json({ message: "Semana no encontrada." });
        }

        await semanaEliminar.destroy();
        return res.status(200).json({ message: "Semana eliminada correctamente." });

      default:
        return res.status(405).json({ message: "Método no permitido" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}
