import { NextApiRequest, NextApiResponse } from "next";
import { CoccionService } from "@/lib/services/CoccionService";
import { CoccionPersonalService } from "@/lib/services/CoccionPersonalService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coccionService = new CoccionService();
const coccionOperadorService = new CoccionPersonalService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { id_coccion, include_relations, include_personal, include_complete, id_semana_laboral } = query;

        // Si se solicita filtrar por semana laboral
        if (id_semana_laboral) {
          const coccionesPorSemana = await prisma.coccion.findMany({
            where: { 
              semana_laboral_id_semana_laboral: Number(id_semana_laboral)
            },
            include: {
              semana_laboral: {
                select: {
                  id_semana_laboral: true,
                  fecha_inicio: true,
                  fecha_fin: true,
                  estado: true
                }
              },
              coccion_personal: {
                include: {
                  personal: {
                    select: {
                      id_personal: true,
                      nombre_completo: true,
                      dni: true,
                      pago_diario_normal: true,
                      pago_diario_reducido: true
                    }
                  },
                  cargo_coccion: {
                    select: {
                      id_cargo_coccion: true,
                      nombre_cargo: true,
                      costo_cargo: true
                    }
                  }
                }
              }
            }
          });

          return res.status(200).json(coccionesPorSemana);
        }

        // Si se solicita la información completa de la cocción
        if (id_coccion && include_complete === 'true') {
          const coccionCompleta = await prisma.coccion.findUnique({
            where: { 
              id_coccion: Number(id_coccion) 
            },
            include: {
              semana_laboral: {
                select: {
                  id_semana_laboral: true,
                  fecha_inicio: true,
                  fecha_fin: true,
                  estado: true
                }
              },
              coccion_personal: {
                include: {
                  personal: {
                    select: {
                      id_personal: true,
                      nombre_completo: true,
                      dni: true,
                      pago_diario_normal: true,
                      pago_diario_reducido: true
                    }
                  },
                  cargo_coccion: {
                    select: {
                      id_cargo_coccion: true,
                      nombre_cargo: true,
                      costo_cargo: true
                    }
                  }
                }
              }
            }
          });

          if (!coccionCompleta) {
            return res.status(404).json({ message: 'Cocción no encontrada' });
          }

          return res.status(200).json(coccionCompleta);
        }

        // Si se solicita operadores específicamente (mantener para compatibilidad)
        if (id_coccion && include_personal === 'true') {
          const operadores = await coccionService.getOperadoresByCoccion(Number(id_coccion));
          return res.status(200).json(operadores);
        }

        // Si se solicita cocción con relaciones (mantener para compatibilidad)
        if (id_coccion && include_relations === 'true') {
          const data = await coccionService.findByIdComplete(Number(id_coccion));
          return res.status(200).json(data);
        }

        // Si solo se solicita la cocción (mantener para compatibilidad)
        if (id_coccion) {
          const coccion = await prisma.coccion.findUnique({
            where: { id_coccion: Number(id_coccion) },
            include: {
              horno: true,
              semana_laboral: true,
              coccion_personal: {
                include: {
                  personal: true,
                  cargo_coccion: true
                }
              }
            }
          });
          return res.status(200).json(coccion);
        }

        // Listar todas las cocciones (mantener igual)
        const cocciones = await prisma.coccion.findMany({
          where: {
            id_empresa: req.query.id_empresa as unknown as number
          },
          include: {
            horno: true,
            semana_laboral: true
          },
          orderBy: {
            id_coccion: 'desc'
          }
        });
        return res.status(200).json(cocciones);
      } catch (error) {
        console.error('Error en GET coccion:', error);
        return res.status(500).json({ message: 'Error al obtener datos' });
      }
    case "POST":
      try {
        const { coccion, operadores } = req.body;
        
        // Validar campos obligatorios
        if (!coccion.semana_trabajo_id_semana_trabajo || 
            !coccion.horno_id_horno || 
            !coccion.fecha_encendido) {
          return res.status(400).json({ 
            message: "Los campos semana_trabajo_id_semana_trabajo, horno_id_horno y fecha_encendido son obligatorios" 
          });
        }

        const coccionData = {
          ...coccion,
          semana_laboral_id_semana_laboral: coccion.semana_trabajo_id_semana_trabajo,
          fecha_encendido: new Date(coccion.fecha_encendido),
        };
        delete coccionData.semana_trabajo_id_semana_trabajo;

        const result = await coccionService.createCoccionWithOperadores(coccionData, operadores);
        return res.status(201).json(result);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      try {
        const { where, coccion, operadores } = req.body;
        // Convertir id_coccion a número y validar
        const id_coccion = Number(where?.id_coccion);
        if (!id_coccion || isNaN(id_coccion)) {
          res.status(400).json({ message: "id_coccion es requerido y debe ser un número válido" });
          return;
        }

        // Validar campos obligatorios de cocción
        if (!coccion.semana_trabajo_id_semana_trabajo || 
            !coccion.horno_id_horno || 
            !coccion.fecha_encendido) {
          return res.status(400).json({ 
            message: "Los campos semana_trabajo_id_semana_trabajo, horno_id_horno y fecha_encendido son obligatorios" 
          });
        }

        // Mapear los campos al formato correcto para Prisma
        const coccionData = {
          ...coccion,
          semana_laboral_id_semana_laboral: coccion.semana_trabajo_id_semana_trabajo,
          fecha_encendido: new Date(coccion.fecha_encendido),
        };
        
        // Eliminar el campo incorrecto
        delete coccionData.semana_trabajo_id_semana_trabajo;

        // Validar operadores si se proporcionan
        if (operadores?.length) {
          const operadoresInvalidos = operadores.some((op: any) => 
            !op.personal_id_personal || !op.cargo_coccion_id_cargo_coccion
          );

          if (operadoresInvalidos) {
            return res.status(400).json({ 
              message: "Cada operador debe tener personal_id_personal y cargo_coccion_id_cargo_coccion" 
            });
          }
        }

        // Eliminar id_coccion del objeto coccion antes de actualizar
        const { id_coccion: _, ...coccionSinId } = coccion || {};

        // Llama al servicio con el objeto limpio
        const result = await coccionService.updateCoccionCompleta(id_coccion, coccionSinId, operadores);

        res.status(200).json(result);
        return;
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }

    case "DELETE":
      try {
        const id_coccion = Number(req.query.id_coccion);
        
        if (!id_coccion || isNaN(id_coccion)) {
            return res.status(400).json({ message: "ID de cocción inválido" });
        }

        const result = await coccionService.deleteCoccionCompleta(id_coccion);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error al eliminar:', error);
        return res.status(500).json({ 
            message: error instanceof Error ? error.message : "Error al eliminar cocción" 
        });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
