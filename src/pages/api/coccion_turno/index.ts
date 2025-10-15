import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import CoccionTurnoService from "@/lib/services/CoccionTurnoService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: "No autorizado" });

  const id_empresa = Number(session.user?.id_empresa);
  if (!id_empresa) return res.status(400).json({ message: "ID de empresa inválido" });

  try {
    switch (req.method) {
      case "GET":
        // Filtrar por rango de fechas específico
        if (req.query.fechaInicio && req.query.fechaFin) {
          const fechaInicio = new Date(req.query.fechaInicio as string);
          const fechaFin = new Date(req.query.fechaFin as string);
          // Ajustar fecha fin para incluir todo el día
          fechaFin.setHours(23, 59, 59, 999);
          
          const turnosPorRangoFecha = await prisma.coccion_turno.findMany({
            where: {
              fecha: {
                gte: fechaInicio,
                lte: fechaFin
              },
              coccion: {
                id_empresa: id_empresa
              }
            },
            include: {
              coccion: true,
              cargo_coccion: true
            },
            orderBy: {
              fecha: 'asc'
            }
          });
          
          console.log(`Turnos en rango ${fechaInicio.toISOString()} a ${fechaFin.toISOString()}: ${turnosPorRangoFecha.length}`);
          return res.status(200).json(turnosPorRangoFecha);
        }
        
        // Consulta turnos por id_semana si se proporciona el parámetro
        if (req.query.id_semana) {
          const id_semana = parseInt(req.query.id_semana as string, 10);
          
          // Primero obtenemos la información de la semana para conocer sus fechas
          const semanaLaboral = await prisma.semana_laboral.findUnique({
            where: { id_semana_laboral: id_semana }
          });
          
          if (!semanaLaboral) {
            return res.status(404).json({ message: "Semana laboral no encontrada" });
          }
          
          // Calculamos el rango de fechas de la semana
          const fechaInicio = new Date(semanaLaboral.fecha_inicio);
          const fechaFin = new Date(semanaLaboral.fecha_fin);
          // Añadimos un día al final para incluir todo el último día
          fechaFin.setDate(fechaFin.getDate() + 1);
          
          // Consulta 1: Turnos asociados directamente a cocciones de esta semana
          const turnosPorCoccion = await prisma.coccion_turno.findMany({
            where: {
              coccion: {
                semana_laboral_id_semana_laboral: id_semana,
                id_empresa: id_empresa
              }
            },
            include: {
              coccion: true,
              cargo_coccion: true
            }
          });
          
          // Consulta 2: Turnos cuya fecha cae dentro del rango de esta semana,
          // incluso si la cocción está asociada a otra semana
          const turnosPorFecha = await prisma.coccion_turno.findMany({
            where: {
              fecha: {
                gte: fechaInicio,
                lt: fechaFin
              },
              coccion: {
                id_empresa: id_empresa
              },
              // Excluimos los que ya obtuvimos en la consulta anterior
              NOT: {
                coccion: {
                  semana_laboral_id_semana_laboral: id_semana
                }
              }
            },
            include: {
              coccion: true,
              cargo_coccion: true
            }
          });
          
          // Consulta 3: Turnos que pertenecen a cocciones que están activas 
          // durante la semana solicitada, independientemente de la semana_laboral_id
          // de la cocción y de la fecha específica del turno
          const turnosDeCocci = await prisma.coccion_turno.findMany({
            where: {
              coccion: {
                id_empresa: id_empresa,
                // Cocciones que se superponen con la semana solicitada
                AND: [
                  {
                    fecha_encendido: {
                      lte: fechaFin
                    }
                  },
                  {
                    fecha_apagado: {
                      gte: fechaInicio
                    }
                  }
                ],
                // Excluimos las cocciones que ya obtuvimos en la primera consulta
                NOT: {
                  semana_laboral_id_semana_laboral: id_semana
                }
              },
              // Excluimos turnos que ya obtuvimos en las consultas anteriores
              NOT: {
                OR: [
                  {
                    fecha: {
                      gte: fechaInicio,
                      lt: fechaFin
                    }
                  }
                ]
              }
            },
            include: {
              coccion: true,
              cargo_coccion: true
            }
          });
          
          // Combinamos los tres conjuntos de resultados
          const todosLosTurnos = [...turnosPorCoccion, ...turnosPorFecha, ...turnosDeCocci];
          
          console.log(`Total turnos recuperados para semana ${id_semana}: ${todosLosTurnos.length}`);
          console.log(`- Por cocción: ${turnosPorCoccion.length}`);
          console.log(`- Por fecha: ${turnosPorFecha.length}`);
          console.log(`- De cocciones extendidas: ${turnosDeCocci.length}`);
          
          return res.status(200).json(todosLosTurnos);
        } 
        // Consulta turnos por id_personal y id_semana
        else if (req.query.id_personal && req.query.id_semana) {
          const idPersonal = parseInt(req.query.id_personal as string, 10);
          const idSemana = parseInt(req.query.id_semana as string, 10);
          
          // Obtenemos la información de la semana para conocer sus fechas
          const semanaLaboral = await prisma.semana_laboral.findUnique({
            where: { id_semana_laboral: idSemana }
          });
          
          if (!semanaLaboral) {
            return res.status(404).json({ message: "Semana laboral no encontrada" });
          }
          
          // Calculamos el rango de fechas de la semana
          const fechaInicio = new Date(semanaLaboral.fecha_inicio);
          const fechaFin = new Date(semanaLaboral.fecha_fin);
          // Añadimos un día al final para incluir todo el último día
          fechaFin.setDate(fechaFin.getDate() + 1);
          
          // Consulta 1: Turnos de este personal en cocciones asociadas directamente a esta semana
          const turnosPorCoccion = await prisma.coccion_turno.findMany({
            where: {
              personal_id_personal: idPersonal,
              coccion: {
                semana_laboral_id_semana_laboral: idSemana,
                id_empresa: id_empresa
              }
            },
            include: {
              coccion: {
                include: {
                  horno: true
                }
              },
              cargo_coccion: true
            }
          });
          
          // Consulta 2: Turnos de este personal cuya fecha cae dentro del rango de esta semana,
          // incluso si la cocción está asociada a otra semana
          const turnosPorFecha = await prisma.coccion_turno.findMany({
            where: {
              personal_id_personal: idPersonal,
              fecha: {
                gte: fechaInicio,
                lt: fechaFin
              },
              coccion: {
                id_empresa: id_empresa
              },
              // Excluimos los que ya obtuvimos en la consulta anterior
              NOT: {
                coccion: {
                  semana_laboral_id_semana_laboral: idSemana
                }
              }
            },
            include: {
              coccion: {
                include: {
                  horno: true
                }
              },
              cargo_coccion: true
            }
          });
          
          // Consulta 3: Turnos de este personal que pertenecen a cocciones activas 
          // durante la semana solicitada, independientemente de la fecha del turno
          const turnosDeCocci = await prisma.coccion_turno.findMany({
            where: {
              personal_id_personal: idPersonal,
              coccion: {
                id_empresa: id_empresa,
                // Cocciones que se superponen con la semana solicitada
                AND: [
                  {
                    fecha_encendido: {
                      lte: fechaFin
                    }
                  },
                  {
                    fecha_apagado: {
                      gte: fechaInicio
                    }
                  }
                ],
                // Excluimos las cocciones que ya obtuvimos en la primera consulta
                NOT: {
                  semana_laboral_id_semana_laboral: idSemana
                }
              },
              // Excluimos turnos que ya obtuvimos en las consultas anteriores
              NOT: {
                OR: [
                  {
                    fecha: {
                      gte: fechaInicio,
                      lt: fechaFin
                    }
                  }
                ]
              }
            },
            include: {
              coccion: {
                include: {
                  horno: true
                }
              },
              cargo_coccion: true
            }
          });
          
          // Combinamos los tres conjuntos de resultados
          const todosLosTurnos = [...turnosPorCoccion, ...turnosPorFecha, ...turnosDeCocci];
          
          console.log(`Total turnos recuperados para personal ${idPersonal} en semana ${idSemana}: ${todosLosTurnos.length}`);
          console.log(`- Por cocción: ${turnosPorCoccion.length}`);
          console.log(`- Por fecha: ${turnosPorFecha.length}`);
          console.log(`- De cocciones extendidas: ${turnosDeCocci.length}`);
          
          return res.status(200).json(
            todosLosTurnos.sort((a, b) => {
              const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
              const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
              return fechaA - fechaB;
            })
          );
        } 
        // Consulta turnos por id_coccion si se proporciona un parámetro
        else if (req.query.id_coccion) {
          const coccionId = parseInt(req.query.id_coccion as string, 10);
          const turnos = await prisma.coccion_turno.findMany({
            where: {
              coccion_id_coccion: coccionId,
              coccion: {
                id_empresa: id_empresa
              }
            },
            include: {
              coccion: {
                include: {
                  horno: true
                }
              },
              cargo_coccion: true
            },
            orderBy: {
              fecha: 'asc'
            }
          });

          // Enriquecer los datos con información adicional
          const turnosConNombres = await Promise.all(turnos.map(async (turno) => {
            // Para personal interno, obtener el nombre
            let nombrePersonal = null;
            if (turno.personal_id_personal) {
              const personal = await prisma.personal.findUnique({
                where: { id_personal: turno.personal_id_personal }
              });
              nombrePersonal = personal?.nombre_completo;
            }

            return {
              ...turno,
              nombre_personal: nombrePersonal,
              nombre_horno: turno.coccion?.horno?.nombre || null
            };
          }));

          return res.status(200).json(turnosConNombres);
        } else if (req.query.id) {
          // Consulta un turno específico por ID
          const id = parseInt(req.query.id as string, 10);
          const turno = await CoccionTurnoService.findById(id);
          return res.status(200).json(turno);
        } else {
          // Consulta todos los turnos de la empresa
          const turnos = await CoccionTurnoService.findAllByEmpresa(id_empresa);
          return res.status(200).json(turnos);
        }

      case "POST":
        // Comprobar si es un array o un objeto único
        let dataToCreate = Array.isArray(req.body) ? req.body : [req.body];
        
        // Verificar que tenemos datos válidos
        if (!dataToCreate || dataToCreate.length === 0) {
          return res.status(400).json({ message: "Datos de turno inválidos" });
        }

        // Crear múltiples registros en transacción
        const createdTurnos = await prisma.$transaction(
          dataToCreate.map((data) => {
            // Mapear los datos para adaptarlos al esquema
            const turnoData = {
              coccion_id_coccion: data.id_coccion,
              cargo_coccion_id_cargo_coccion: data.cargo_coccion_id,
              fecha: new Date(data.fecha),
              // Manejar el caso de personal interno vs externo
              ...(data.tipo_personal === "interno" 
                ? { personal_id_personal: data.id_personal } 
                : { personal_externo: data.personal_externo })
            };

            return prisma.coccion_turno.create({
              data: turnoData
            });
          })
        );

        return res.status(201).json(createdTurnos);

      case "PUT":
        const idToUpdate = req.query.id 
          ? parseInt(req.query.id as string, 10)
          : req.body.id_coccion_personal;
        
        if (!idToUpdate) {
          return res.status(400).json({ message: "ID es requerido para actualizar" });
        }

        // Mapear los datos para adaptarlos al esquema
        const dataToUpdate = {
          coccion_id_coccion: req.body.id_coccion,
          cargo_coccion_id_cargo_coccion: req.body.cargo_coccion_id,
          fecha: req.body.fecha ? new Date(req.body.fecha) : undefined,
          // Manejar el caso de personal interno vs externo
          ...(req.body.tipo_personal === "interno" 
            ? { personal_id_personal: req.body.id_personal, personal_externo: null } 
            : { personal_id_personal: null, personal_externo: req.body.personal_externo })
        };

        const actualizado = await prisma.coccion_turno.update({
          where: { id_coccion_personal: idToUpdate },
          data: dataToUpdate
        });
        
        return res.status(200).json(actualizado);

      case "DELETE":
        const idToDelete = parseInt(req.query.id as string, 10);
        if (!idToDelete) {
          return res.status(400).json({ message: "ID es requerido para eliminar" });
        }

        await CoccionTurnoService.deleteTurno(idToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/coccion_turno:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Error desconocido' });
  }
}
