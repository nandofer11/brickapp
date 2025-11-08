import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

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
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Método ${req.method} no permitido.`);
    }

    // Obtener mes y año de los parámetros de consulta o usar el mes y año actuales
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1; // JavaScript months are 0-indexed
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    // Construir fechas de inicio y fin para el mes solicitado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último día del mes

    // Obtener todas las asistencias del mes para todos los empleados de la empresa
    const asistencias = await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        personal: {
          id_empresa,
          // Solo incluir personal activo
          estado: 1,
        },
      },
      include: {
        personal: true,
      },
    });

    console.log(`Asistencias encontradas para ${month}/${year}: ${asistencias.length}`);
    console.log(`Rango de fechas: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    
    // Si no hay asistencias, intentar verificar si hay registros en general
    if (asistencias.length === 0) {
      const totalAsistencias = await prisma.asistencia.count({
        where: {
          personal: {
            id_empresa,
          },
        },
      });
      console.log(`Total de asistencias en la empresa: ${totalAsistencias}`);
    }

    // Agrupar asistencias por empleado
    type EmpleadoAsistencia = {
      id_personal: number;
      nombre: string;
      diasCompletos: number;
      mediosDias: number;
      totalDias: number;
    };

    interface AsistenciaConPersonal {
      id_asistencia: number;
      fecha: Date;
      id_personal: number | null;
      id_semana_laboral: number;
      estado: 'A' | 'I' | 'M'; // Enum de asistencia_estado: A (asistencia), I (inactivo), M (medio día)
      created_at: Date;
      updated_at: Date;
      personal: {
        id_personal: number;
        nombre_completo: string;
        // Otros campos del modelo personal
      } | null;
    }

    const asistenciasPorEmpleado = asistencias.reduce<Record<number, EmpleadoAsistencia>>((result, asistencia) => {
      const idPersonal = asistencia.id_personal;
      const personal = asistencia.personal;

      // Verificar que idPersonal no sea null ni undefined y que personal exista
      if (idPersonal == null || !personal) {
        return result;
      }

      // Inicializar el objeto del empleado si no existe
      if (!result[idPersonal]) {
        result[idPersonal] = {
          id_personal: idPersonal,
          nombre: personal.nombre_completo,
          diasCompletos: 0,
          mediosDias: 0,
          totalDias: 0,
        };
      }

      // Contar según el estado de asistencia (A = completo, M = medio día, I = inactivo)
      if (asistencia.estado === 'A') {
        result[idPersonal].diasCompletos += 1;
        result[idPersonal].totalDias += 1;
      } else if (asistencia.estado === 'M') {
        result[idPersonal].mediosDias += 1;
        result[idPersonal].totalDias += 0.5; // Medio día cuenta como 0.5
      }
      // No contamos el estado 'I' (inactivo)

      return result;
    }, {});

    // Convertir el objeto a un array para la respuesta
    const asistenciasAgregadas = Object.values(asistenciasPorEmpleado);

    // Ordenar por nombre de empleado
    asistenciasAgregadas.sort((a: EmpleadoAsistencia, b: EmpleadoAsistencia) => a.nombre.localeCompare(b.nombre));

    // Agregar información del mes y año
    const respuesta = {
      mes: month,
      año: year,
      datos: asistenciasAgregadas,
    };

    return res.status(200).json(respuesta);
  } catch (error) {
    console.error("Error en /api/asistencia/mensual:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
