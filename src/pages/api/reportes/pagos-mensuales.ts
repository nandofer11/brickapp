import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import ReporteMensualService from "@/lib/services/ReporteMensualService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticación
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const id_empresa = Number(session.user?.id_empresa);
  if (!id_empresa) {
    return res.status(400).json({ message: "ID de empresa inválido" });
  }

  if (req.method === "GET") {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ 
          message: "Fechas de inicio y fin son requeridas",
          required: ["fecha_inicio", "fecha_fin"]
        });
      }

      // Convertir y validar fechas
      const fechaInicio = new Date(fecha_inicio as string);
      const fechaFin = new Date(fecha_fin as string);
      
      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        return res.status(400).json({ message: "Formato de fechas inválido" });
      }

      // Ajustar fechas para incluir todo el día y evitar problemas de zona horaria
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);

      console.log(`API: Generando reporte mensual del ${fechaInicio.toISOString()} al ${fechaFin.toISOString()}`);
      console.log(`API: Fechas locales - Inicio: ${fechaInicio.toLocaleDateString()} Fin: ${fechaFin.toLocaleDateString()}`);

      // Crear fechas sin ajustes de zona horaria para el cálculo de días laborales
      const fechaInicioCalculo = new Date(fecha_inicio as string + 'T00:00:00');
      const fechaFinCalculo = new Date(fecha_fin as string + 'T23:59:59');

      console.log(`API: Fechas para cálculo - Inicio: ${fechaInicioCalculo.toISOString()} Fin: ${fechaFinCalculo.toISOString()}`);

      // Obtener datos transaccionales
      const datos = await ReporteMensualService.generarReporteMensual(
        fechaInicio, 
        fechaFin, 
        id_empresa
      );

      // Procesar y calcular totales usando fechas sin zona horaria
      const reporte = await ReporteMensualService.procesarDatosReporte(datos, fechaInicioCalculo, fechaFinCalculo);

      console.log(`API: Reporte generado exitosamente con ${reporte.length} registros`);

      return res.status(200).json(reporte);
    } catch (error) {
      console.error("Error al generar reporte mensual:", error);
      return res.status(500).json({ 
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}