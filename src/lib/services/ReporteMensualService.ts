import { prisma } from "@/lib/prisma";

export class ReporteMensualService {
  async generarReporteMensual(fechaInicio: Date, fechaFin: Date, id_empresa: number) {
    try {
      console.log(`Generando reporte mensual del ${fechaInicio.toISOString()} al ${fechaFin.toISOString()} para empresa ${id_empresa}`);

      // 1. Obtener personal activo
      const personal = await prisma.personal.findMany({
        where: { 
          id_empresa, 
          estado: 1 
        },
        select: {
          id_personal: true,
          nombre_completo: true,
          dni: true,
          pago_diario_normal: true,
          pago_diario_reducido: true,
          estado: true
        }
      });

      // 2. Obtener asistencias por rango de fechas exacto
      const asistencias = await prisma.asistencia.findMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          },
          personal: { id_empresa }
        },
        include: {
          personal: {
            select: {
              id_personal: true,
              nombre_completo: true
            }
          }
        }
      });

      // 3. Obtener tareas extra por rango de fechas
      const tareasExtra = await prisma.tarea_extra.findMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          },
          personal: { id_empresa }
        },
        include: {
          personal: {
            select: {
              id_personal: true,
              nombre_completo: true
            }
          }
        }
      });

      // 4. Obtener turnos de cocción por fecha
      const turnosCoccion = await prisma.coccion_turno.findMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          },
          coccion: { 
            id_empresa
          }
        },
        include: {
          cargo_coccion: true,
          coccion: {
            include: {
              horno: true
            }
          }
        }
      });

      // 5. Obtener adelantos por rango de fechas
      const adelantos = await prisma.adelanto_pago.findMany({
        where: {
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          },
          personal: { id_empresa }
        },
        include: {
          personal: {
            select: {
              id_personal: true,
              nombre_completo: true
            }
          }
        }
      });

      // 6. Obtener descuentos por rango de fechas (si existe la tabla)
      let descuentos: any[] = [];
      try {
        // Verificar si existe la tabla descuento_personal
        descuentos = await prisma.descuento_personal.findMany({
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin
            },
            personal: { id_empresa }
          },
          include: {
            personal: {
              select: {
                id_personal: true,
                nombre_completo: true
              }
            }
          }
        });
      } catch (error) {
        console.log("Tabla descuento_personal no encontrada, continuando sin descuentos");
        descuentos = [];
      }

      console.log(`Datos obtenidos: ${personal.length} personal, ${asistencias.length} asistencias, ${tareasExtra.length} tareas extra, ${turnosCoccion.length} turnos cocción, ${adelantos.length} adelantos, ${descuentos.length} descuentos`);

      return {
        personal,
        asistencias,
        tareasExtra,
        turnosCoccion,
        adelantos,
        descuentos
      };
    } catch (error) {
      console.error("Error al generar reporte mensual:", error);
      throw error;
    }
  }

  // Método para procesar los datos y calcular totales
  async procesarDatosReporte(datos: any, fechaInicio: Date, fechaFin: Date) {
    const { personal, asistencias, tareasExtra, turnosCoccion, adelantos, descuentos } = datos;
    
    // Calcular días laborales del periodo (lunes a sábado)
    const diasLaboralesPeriodo = this.calcularDiasLaborales(fechaInicio, fechaFin);
    console.log(`Días laborales en el período: ${diasLaboralesPeriodo}`);
    
    const reporte = personal.map((persona: any) => {
      // Filtrar datos por persona
      const asistenciasPersona = asistencias.filter((a: any) => a.id_personal === persona.id_personal);
      const tareasPersona = tareasExtra.filter((t: any) => t.id_personal === persona.id_personal);
      const turnosPersona = turnosCoccion.filter((tc: any) => tc.personal_id_personal === persona.id_personal);
      const adelantosPersona = adelantos.filter((a: any) => a.id_personal === persona.id_personal);
      const descuentosPersona = descuentos.filter((d: any) => d.id_personal === persona.id_personal);

      // Calcular asistencias
      const diasCompletos = asistenciasPersona.filter((a: any) => a.estado === 'A').length;
      const mediosDias = asistenciasPersona.filter((a: any) => a.estado === 'M').length;
      const faltas = asistenciasPersona.filter((a: any) => a.estado === 'I').length;

      // Calcular total por asistencias
      const pagoDiario = parseFloat(persona.pago_diario_normal || '0');
      const totalAsistencias = (diasCompletos * pagoDiario) + (mediosDias * pagoDiario * 0.5);

      // Calcular total tareas extra
      const totalTareasExtra = tareasPersona.reduce((sum: number, t: any) => 
        sum + parseFloat(t.monto || '0'), 0);

      // Calcular total cocción (separar cocciones de humeadas)
      let totalCoccion = 0;
      let totalHumeada = 0;
      let coccionesCount = 0;
      let humeadasCount = 0;

      const coccionesIds = new Set<number>();
      const humeadasIds = new Set<number>();

      turnosPersona.forEach((turno: any) => {
        const costoCargo = parseFloat(turno.cargo_coccion?.costo_cargo || '0');
        const nombreCargo = turno.cargo_coccion?.nombre_cargo?.toLowerCase() || '';
        const coccionId = turno.coccion_id_coccion;

        if (nombreCargo.includes('humeador')) {
          humeadasIds.add(coccionId);
          totalHumeada += costoCargo;
        } else {
          coccionesIds.add(coccionId);
          totalCoccion += costoCargo;
        }
      });

      coccionesCount = coccionesIds.size;
      humeadasCount = humeadasIds.size;

      // Calcular total adelantos
      const totalAdelantos = adelantosPersona.reduce((sum: number, a: any) => 
        sum + parseFloat(a.monto || '0'), 0);

      // Calcular total descuentos
      const totalDescuentos = descuentosPersona.reduce((sum: number, d: any) => 
        sum + parseFloat(d.monto || '0'), 0);

      // Calcular total final
      const totalFinal = totalAsistencias + totalTareasExtra + totalCoccion + totalHumeada - totalAdelantos - totalDescuentos;

      return {
        id_personal: persona.id_personal,
        nombre_completo: persona.nombre_completo,
        dni: persona.dni,
        estado: persona.estado,
        asistencias: diasCompletos,
        faltas: faltas,
        mediosDias: mediosDias,
        cocciones: coccionesCount,
        totalCoccion: totalCoccion,
        humeadas: humeadasCount,
        totalHumeada: totalHumeada,
        totalAsistencias: totalAsistencias,
        tareasExtras: tareasPersona, // Array de tareas extras para el modal
        totalTareasExtras: totalTareasExtra,
        totalDescuentos: totalDescuentos,
        totalAdelantos: totalAdelantos,
        totalPagoFinal: totalFinal,
        costoPagoDiario: pagoDiario,
        diasLaboralesPeriodo: diasLaboralesPeriodo // Usar el valor calculado
      };
    });

    console.log(`Reporte procesado: ${reporte.length} empleados`);
    return reporte;
  }

  // Método para calcular días laborales (lunes a sábado)
  private calcularDiasLaborales(fechaInicio: Date, fechaFin: Date): number {
    let diasLaborales = 0;
    
    // Crear fechas locales para evitar problemas de zona horaria
    const inicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
    const fin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
    
    console.log(`Calculando días laborales entre ${inicio.getDate()}/${inicio.getMonth() + 1}/${inicio.getFullYear()} y ${fin.getDate()}/${fin.getMonth() + 1}/${fin.getFullYear()}`);
    
    // Verificación especial para septiembre 2025
    if (inicio.getFullYear() === 2025 && inicio.getMonth() === 8) {
      console.log(`🔍 SEPTIEMBRE 2025 - Verificación especial:`);
      console.log(`Fecha inicio: ${inicio.getDate()}/${inicio.getMonth() + 1}/${inicio.getFullYear()} (día de semana: ${inicio.getDay()})`);
      console.log(`Fecha fin: ${fin.getDate()}/${fin.getMonth() + 1}/${fin.getFullYear()} (día de semana: ${fin.getDay()})`);
    }
    
    let currentDate = new Date(inicio);
    
    // Iterar día por día incluyendo el último día
    while (currentDate <= fin) {
      // 0 = domingo, 1 = lunes, ..., 6 = sábado
      const diaSemana = currentDate.getDay();
      const nombreDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana];
      
      // Contar días de lunes a sábado (excluir domingo)
      if (diaSemana !== 0) {
        diasLaborales++;
        console.log(`Día ${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')} (${nombreDia}): LABORAL - Total: ${diasLaborales}`);
      } else {
        console.log(`Día ${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')} (${nombreDia}): DOMINGO - No cuenta`);
      }
      
      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`🎯 Total días laborales calculados: ${diasLaborales}`);
    
    // Verificación final para septiembre
    if (inicio.getFullYear() === 2025 && inicio.getMonth() === 8) {
      console.log(`📊 SEPTIEMBRE 2025 - Resultado final: ${diasLaborales} días laborales`);
      console.log(`✅ Esperado: 26 días laborales (1 Lunes a 30 Martes, excluyendo 4 domingos)`);
    }
    
    return diasLaborales;
  }
}

export default new ReporteMensualService();