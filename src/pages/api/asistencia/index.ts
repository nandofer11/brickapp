import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import AsistenciaService from "@/lib/services/AsistenciaService";

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
          const asistencia = await AsistenciaService.findById(id);
          return res.status(200).json(asistencia);
        } else {
          const asistencias = await AsistenciaService.findAllByEmpresa(id_empresa);
          return res.status(200).json(asistencias);
        }

      case "POST":
        const nuevaAsistencia = await AsistenciaService.createAsistencia(req.body);
        return res.status(201).json(nuevaAsistencia);

      case "PUT":

      // Verificar si el body es un array
        if (Array.isArray(req.body)) {
          // Procesar actualizaciones múltiples
          const actualizaciones = await Promise.all(
            req.body.map(async (asistencia) => {
              if (!asistencia.id_asistencia) {
                throw new Error("Cada asistencia debe tener un id_asistencia");
              }
              return await AsistenciaService.updateAsistencia(
                asistencia.id_asistencia,
                asistencia
              );
            })
          );
          return res.status(200).json(actualizaciones);
        }

        
        const idToUpdate = req.query.id 
          ? parseInt(req.query.id as string, 10)
          : req.body.id_asistencia;

        if (!idToUpdate) {
          return res.status(400).json({ 
            error: "ID es requerido para actualizar. Debe proporcionarse en la URL o en el body" 
          });
        }

        const updatedAsistencia = await AsistenciaService.updateAsistencia(idToUpdate, req.body);
        return res.status(200).json(updatedAsistencia);

      case "DELETE":
        const idToDelete = parseInt(req.query.id as string, 10);
        if (!idToDelete) {
          return res.status(400).json({ error: "ID es requerido para eliminar." });
        }

        await AsistenciaService.deleteAsistencia(idToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/asistencia:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
