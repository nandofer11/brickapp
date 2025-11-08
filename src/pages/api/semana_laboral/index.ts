import { NextApiRequest, NextApiResponse } from "next";
import SemanaLaboralService from "@/lib/services/SemanaLaboralService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

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
          const semanaLaboral = await SemanaLaboralService.findById(id);
          return res.status(200).json(semanaLaboral);
        } else {
           // Verificar si hay un filtro de estado en la consulta
          const estado = req.query.estado ? parseInt(req.query.estado as string, 10) : undefined;
          
          // Verificar si hay un límite de resultados
          const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
          
          // Verificar si hay filtros de fecha
          const fechaInicio = req.query.fecha_inicio as string;
          const fechaFin = req.query.fecha_fin as string;
          
          // Si hay filtros de fecha, filtrar por fecha
          if (fechaInicio && fechaFin) {
            console.log(`API: Filtrando semanas por fechas: ${fechaInicio} - ${fechaFin}`);
            
            // Obtener todas las semanas de la empresa
            const todasLasSemanas = await SemanaLaboralService.findAllByIdEmpresa(id_empresa);
            
            // Filtrar las semanas que se solapan con el rango de fechas
            const semanasEnRango = todasLasSemanas.filter(semana => {
              // Convertir fechas a objetos Date para comparación
              const inicio = new Date(semana.fecha_inicio);
              const fin = new Date(semana.fecha_fin);
              const rangoInicio = new Date(fechaInicio);
              const rangoFin = new Date(fechaFin);
              
              // Una semana está en el rango si:
              // - Comienza antes de que termine el rango Y
              // - Termina después de que comienza el rango
              return inicio <= rangoFin && fin >= rangoInicio;
            });
            
            console.log(`API: Encontradas ${semanasEnRango.length} semanas en el rango de fechas`);
            return res.status(200).json(semanasEnRango);
          }
          // Si hay un filtro de estado, usar findByEmpresaAndEstado
          else if (estado !== undefined) {
            const semanasLaborales = await SemanaLaboralService.findByEmpresaAndEstado(id_empresa, estado);
            return res.status(200).json(semanasLaborales);
          } else {
            // Si no hay filtro de estado, pero hay límite, usar findAllByIdEmpresa con limit
            const semanasLaborales = await SemanaLaboralService.findAllByIdEmpresa(id_empresa, limit);
            return res.status(200).json(semanasLaborales);
          }
        }

      case "POST":
        // Validar si ya existe una semana abierta
        const semanas = await SemanaLaboralService.findAllByIdEmpresa(id_empresa);
        const semanaAbierta = semanas.find((semana) => semana.estado === 1);

        if (semanaAbierta) {
          return res.status(400).json({
            message: "No se puede crear una nueva semana mientras exista una semana abierta.",
          });
        }

        // Continuar con la creación
        const newSemanaLaboral = await SemanaLaboralService.createSemanaLaboral({
          ...req.body,
          id_empresa,
        });

        return res.status(201).json(newSemanaLaboral);

      case "PUT":
        // Obtener el ID de la URL o del body
        const idToUpdate = req.query.id 
          ? parseInt(req.query.id as string, 10)
          : req.body.id_semana_laboral;

        if (!idToUpdate) {
          return res.status(400).json({ 
            error: "ID es requerido para actualizar. Debe proporcionarse en la URL (/api/semana_laboral/19) o en el body (id_semana_laboral)" 
          });
        }

        const updatedSemanaLaboral = await SemanaLaboralService.updateSemanaLaboral(idToUpdate, req.body);
        return res.status(200).json(updatedSemanaLaboral);

      case "DELETE":
        if (!req.query.id) {
          return res.status(400).json({ error: "ID es requerido para eliminar." });
        }

        const idToDelete = parseInt(req.query.id as string, 10);
        const deleted = await SemanaLaboralService.deleteSemanaLaboral(idToDelete, id_empresa);
        return res.status(200).json(deleted);

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/semana_laboral:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}