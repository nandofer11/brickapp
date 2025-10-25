// Función para calcular los días laborales en un periodo (de lunes a sábado)
const calcularDiasLaboralesPeriodo = (fechaInicio: Date, fechaFin: Date): number => {
  let diasLaborales = 0;
  let currentDate = new Date(fechaInicio);
  
  const diasDetalle = [];
  console.log(`    Calculando días laborales entre ${fechaInicio.toLocaleDateString()} y ${fechaFin.toLocaleDateString()}`);
  
  // Iterar día por día
  while (currentDate <= fechaFin) {
    // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const diaSemana = currentDate.getDay();
    const nombreDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana];
    
    // Contar días de lunes a sábado (excluir domingo)
    if (diaSemana !== 0) {
      diasLaborales++;
      diasDetalle.push(`${currentDate.getDate()}-${nombreDia}✓`);
    } else {
      diasDetalle.push(`${currentDate.getDate()}-${nombreDia}✗`);
    }
    
    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`    Días: [${diasDetalle.join(', ')}] = ${diasLaborales} laborales`);
  return diasLaborales;
};

// Función para convertir fecha UTC a fecha local (solo la parte de fecha, sin hora)
const convertirUTCaFechaLocal = (fechaUTC: string): Date => {
  // Tomar solo la parte de fecha (YYYY-MM-DD) sin la hora
  const fechaSolo = fechaUTC.split('T')[0];
  // Crear fecha en zona horaria local a medianoche
  return new Date(fechaSolo + 'T00:00:00');
};

// Función para calcular días laborales usando las semanas laborales directamente
const calcularDiasLaboralesConSemanasDirectas = (
  fechaInicioPeriodo: Date, 
  fechaFinPeriodo: Date, 
  semanasLaborales: any[]
): number => {
  let totalDiasLaborales = 0;
  
  console.log(`=== DEBUG CÁLCULO DÍAS LABORALES ===`);
  console.log(`Periodo del reporte: ${fechaInicioPeriodo.toISOString()} - ${fechaFinPeriodo.toISOString()}`);
  console.log(`Periodo del reporte (local): ${fechaInicioPeriodo.toLocaleDateString()} - ${fechaFinPeriodo.toLocaleDateString()}`);
  console.log(`Semanas laborales disponibles: ${semanasLaborales.length}`);
  
  // Mostrar todas las semanas disponibles
  semanasLaborales.forEach((semana, index) => {
    console.log(`Semana ${index + 1}: ID=${semana.id_semana_laboral}, ${semana.fecha_inicio} - ${semana.fecha_fin}`);
  });
  
  // Para cada semana laboral, calcular la intersección con el periodo
  semanasLaborales.forEach((semana, index) => {
    // Convertir fechas UTC a fechas locales para evitar problemas de zona horaria
    const fechaInicioSemana = convertirUTCaFechaLocal(semana.fecha_inicio);
    const fechaFinSemana = convertirUTCaFechaLocal(semana.fecha_fin);
    
    console.log(`\n--- Procesando Semana ${semana.id_semana_laboral} ---`);
    console.log(`Fechas originales de la semana (UTC): ${semana.fecha_inicio} - ${semana.fecha_fin}`);
    console.log(`Fechas convertidas (local): ${fechaInicioSemana.toISOString()} - ${fechaFinSemana.toISOString()}`);
    console.log(`Fechas para mostrar: ${fechaInicioSemana.toLocaleDateString()} - ${fechaFinSemana.toLocaleDateString()}`);
    
    // Verificar días de la semana
    console.log(`Día inicial: ${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fechaInicioSemana.getDay()]}`);
    console.log(`Día final: ${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fechaFinSemana.getDay()]}`);
    
    // Calcular la intersección entre la semana y el periodo del reporte
    const inicioInterseccion = new Date(Math.max(fechaInicioSemana.getTime(), fechaInicioPeriodo.getTime()));
    const finInterseccion = new Date(Math.min(fechaFinSemana.getTime(), fechaFinPeriodo.getTime()));
    
    console.log(`Intersección calculada: ${inicioInterseccion.toISOString()} - ${finInterseccion.toISOString()}`);
    console.log(`Intersección local: ${inicioInterseccion.toLocaleDateString()} - ${finInterseccion.toLocaleDateString()}`);
    console.log(`¿Hay intersección? ${inicioInterseccion <= finInterseccion}`);
    
    // Solo si hay intersección
    if (inicioInterseccion <= finInterseccion) {
      const diasEnInterseccion = calcularDiasLaboralesPeriodo(inicioInterseccion, finInterseccion);
      totalDiasLaborales += diasEnInterseccion;
      console.log(`✅ Semana ${semana.id_semana_laboral}: ${diasEnInterseccion} días laborales en intersección`);
    } else {
      console.log(`❌ Semana ${semana.id_semana_laboral}: No hay intersección con el periodo`);
    }
  });
  
  console.log(`\n=== RESULTADO FINAL ===`);
  console.log(`Total días laborales calculados: ${totalDiasLaborales}`);
  console.log(`===============================\n`);
  return totalDiasLaborales;
};

// Función para calcular días laborales solo dentro de las semanas laborales registradas (mantener compatibilidad)
const calcularDiasLaboralesEnSemanasRegistradas = (
  fechaInicioPeriodo: Date, 
  fechaFinPeriodo: Date, 
  pagosSemana: any[]
): number => {
  // Obtener las semanas únicas de los pagos
  const semanasUnicas = new Map<number, {fecha_inicio: Date, fecha_fin: Date}>();
  
  pagosSemana.forEach(pago => {
    if (pago.semana_laboral && !semanasUnicas.has(pago.id_semana_laboral)) {
      const fechaInicio = new Date(pago.semana_laboral.fecha_inicio);
      const fechaFin = new Date(pago.semana_laboral.fecha_fin);
      semanasUnicas.set(pago.id_semana_laboral, { fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    }
  });
  
  let totalDiasLaborales = 0;
  
  // Para cada semana única, calcular la intersección con el periodo
  semanasUnicas.forEach((semana, idSemana) => {
    // Calcular la intersección entre la semana y el periodo del reporte
    const inicioInterseccion = new Date(Math.max(semana.fecha_inicio.getTime(), fechaInicioPeriodo.getTime()));
    const finInterseccion = new Date(Math.min(semana.fecha_fin.getTime(), fechaFinPeriodo.getTime()));
    
    // Solo si hay intersección
    if (inicioInterseccion <= finInterseccion) {
      const diasEnInterseccion = calcularDiasLaboralesPeriodo(inicioInterseccion, finInterseccion);
      totalDiasLaborales += diasEnInterseccion;
      console.log(`Semana ${idSemana}: ${diasEnInterseccion} días laborales en intersección con periodo`);
    }
  });
  
  return totalDiasLaborales;
};

// Función de test para GERSON RUIZ LIZANA específicamente
const testCalculoGersonRuiz = () => {
  console.log(`\n🧪 TEST MANUAL PARA GERSON RUIZ LIZANA - AGOSTO 2025`);
  
  const semanasTest = [
    { id: 41, fechaInicio: '2025-07-28', fechaFin: '2025-08-02', asistencias: 5 },
    { id: 42, fechaInicio: '2025-08-04', fechaFin: '2025-08-09', asistencias: 5 },
    { id: 43, fechaInicio: '2025-08-11', fechaFin: '2025-08-16', asistencias: 0 },
    { id: 44, fechaInicio: '2025-08-18', fechaFin: '2025-08-23', asistencias: 6 },
    { id: 45, fechaInicio: '2025-08-25', fechaFin: '2025-08-30', asistencias: 6 }
  ];
  
  const fechaInicioAgosto = new Date('2025-08-01T00:00:00');
  const fechaFinAgosto = new Date('2025-08-31T23:59:59');
  
  let totalAsistenciasEsperadas = 0;
  
  semanasTest.forEach(semana => {
    const fechaInicioSemana = new Date(semana.fechaInicio + 'T00:00:00');
    const fechaFinSemana = new Date(semana.fechaFin + 'T00:00:00');
    
    // Calcular intersección
    const inicioInterseccion = new Date(Math.max(fechaInicioSemana.getTime(), fechaInicioAgosto.getTime()));
    const finInterseccion = new Date(Math.min(fechaFinSemana.getTime(), fechaFinAgosto.getTime()));
    
    if (inicioInterseccion <= finInterseccion) {
      const diasTotalSemana = calcularDiasLaboralesPeriodo(fechaInicioSemana, fechaFinSemana);
      const diasEnAgosto = calcularDiasLaboralesPeriodo(inicioInterseccion, finInterseccion);
      const proporcion = diasEnAgosto / diasTotalSemana;
      const asistenciasEnAgosto = Math.round(semana.asistencias * proporcion);
      
      totalAsistenciasEsperadas += asistenciasEnAgosto;
      
      console.log(`Semana ${semana.id}: ${semana.fechaInicio} - ${semana.fechaFin}`);
      console.log(`  Días totales: ${diasTotalSemana}, Días en agosto: ${diasEnAgosto}`);
      console.log(`  Proporción: ${proporcion.toFixed(3)} (${diasEnAgosto}/${diasTotalSemana})`);
      console.log(`  Asistencias: ${semana.asistencias} * ${proporcion.toFixed(3)} = ${asistenciasEnAgosto}`);
    }
  });
  
  console.log(`\n🎯 RESULTADO ESPERADO: ${totalAsistenciasEsperadas} asistencias`);
  console.log(`==============================================\n`);
};

// Función para procesar los pagos y generar el reporte
export const procesarPagosParaReporte = (
  pagosSemana: any[] = [],
  personal: any[] = [],
  fechaInicio: string,
  fechaFin: string,
  setReportePersonal: (reporte: any[]) => void,
  setTotalPagado: (total: number) => void,
  setError: (error: string | null) => void,
  semanasLaborales: any[] = []
) => {
  // Ejecutar test manual para verificar cálculos esperados
  testCalculoGersonRuiz();

  // Validar que tengamos pagos para procesar
  if (pagosSemana.length === 0) {
    console.warn("No hay pagos disponibles para generar el reporte");
    setError("No se encontraron pagos registrados en el periodo seleccionado");
    return;
  }

  console.log(`Procesando ${pagosSemana.length} pagos para el reporte`);

  // Convertir fechas de inicio y fin para comparación usando la función UTC local
  const fechaInicioObj = new Date(fechaInicio + 'T00:00:00');
  const fechaFinObj = new Date(fechaFin + 'T23:59:59');

  // Asegurarse que las fechas son válidas
  if (isNaN(fechaInicioObj.getTime()) || isNaN(fechaFinObj.getTime())) {
    console.error("Fechas de inicio o fin inválidas");
    setError("Rango de fechas inválido");
    return;
  }

  console.log(`Rango de fechas: ${fechaInicioObj.toISOString()} hasta ${fechaFinObj.toISOString()}`);
  console.log(`Rango de fechas (formato humano): ${fechaInicio} hasta ${fechaFin}`);

  // Calcular días laborales usando las semanas laborales directamente si están disponibles
  let totalDiasLaboralesPeriodo = 0;
  if (semanasLaborales && semanasLaborales.length > 0) {
    totalDiasLaboralesPeriodo = calcularDiasLaboralesConSemanasDirectas(fechaInicioObj, fechaFinObj, semanasLaborales);
  } else {
    // Fallback: usar datos de pagos si no hay semanas laborales directas
    totalDiasLaboralesPeriodo = calcularDiasLaboralesEnSemanasRegistradas(fechaInicioObj, fechaFinObj, pagosSemana);
  }
  console.log(`Total de días laborales en el periodo: ${totalDiasLaboralesPeriodo}`);

  // Agrupar pagos por empleado
  const pagosPorEmpleado = new Map<number, any[]>();

  // Primero agrupamos todos los pagos por empleado
  pagosSemana.forEach(pago => {
    if (!pago.personal || !pago.personal.id_personal) {
      console.warn("Pago sin información de personal:", pago);
      return;
    }

    const idPersonal = pago.personal.id_personal;
    if (!pagosPorEmpleado.has(idPersonal)) {
      pagosPorEmpleado.set(idPersonal, []);
    }
    pagosPorEmpleado.get(idPersonal)?.push(pago);
  });

  console.log(`Pagos agrupados por ${pagosPorEmpleado.size} empleados`);

  // Ahora procesamos los pagos de cada empleado para crear el reporte
  const reporte: any[] = [];

  pagosPorEmpleado.forEach((pagosEmpleado, idPersonal) => {
    if (pagosEmpleado.length === 0) return;

    // Tomamos el primer pago para obtener la información básica del empleado
    const primerPago = pagosEmpleado[0];
    const empleado = primerPago.personal;
    
    // Flag especial para GERSON RUIZ LIZANA
    const esGersonRuiz = empleado.nombre_completo?.includes('GERSON RUIZ LIZANA');
    
    if (esGersonRuiz) {
      console.log(`\n🎯 PROCESANDO A GERSON RUIZ LIZANA (ID: ${idPersonal})`);
      console.log(`Pagos disponibles: ${pagosEmpleado.length}`);
    }

    // Contamos asistencias, faltas y medios días
    let asistenciasCount = 0;
    let faltasCount = 0;
    let mediosDiasCount = 0;
    let coccionesCount = 0;
    let totalCoccion = 0;
    let humeadasCount = 0;
    let totalHumeada = 0;
    let totalTareasExtras = 0;

    // Lista para almacenar las tareas extras de todos los pagos
    const tareasExtrasLista: any[] = [];
    
    // Conjunto para rastrear las semanas ya contabilizadas y evitar duplicados
    const semanasContabilizadas = new Set<number>();

    // Procesar cada pago del empleado
    pagosEmpleado.forEach(pago => {
      // Verificar si ya contabilizamos esta semana para este empleado
      if (semanasContabilizadas.has(pago.id_semana_laboral)) {
        console.log(`Semana ${pago.id_semana_laboral} ya contabilizada para ${empleado.nombre_completo}, evitando duplicación`);
        return;
      }
      
      // Marcar esta semana como contabilizada
      semanasContabilizadas.add(pago.id_semana_laboral);
      
      // Verificar que el pago esté dentro del rango de fechas del mes
      const fechaPago = pago.fecha_pago ? new Date(pago.fecha_pago) : null;
      
      // ⚠️ CORRECCIÓN IMPORTANTE: Convertir fechas de semana de UTC a local ANTES de hacer intersecciones
      const semanaInicioLocal = pago.semana_laboral?.fecha_inicio ? convertirUTCaFechaLocal(pago.semana_laboral.fecha_inicio) : null;
      const semanaFinLocal = pago.semana_laboral?.fecha_fin ? convertirUTCaFechaLocal(pago.semana_laboral.fecha_fin) : null;
      
      // Verificar que las fechas de la semana se solapen con el rango del reporte
      if (semanaInicioLocal && semanaFinLocal) {
        const semanaDentroDeRango = 
          (semanaInicioLocal <= fechaFinObj && semanaFinLocal >= fechaInicioObj);
          
        if (!semanaDentroDeRango) {
          console.log(`Semana ${pago.id_semana_laboral} (${semanaInicioLocal.toISOString()} - ${semanaFinLocal.toISOString()}) fuera del rango de reporte, ignorando`);
          return;
        }
        
        // Calcular días laborales en la intersección del rango del reporte y la semana
        const inicioInterseccion = new Date(Math.max(semanaInicioLocal.getTime(), fechaInicioObj.getTime()));
        const finInterseccion = new Date(Math.min(semanaFinLocal.getTime(), fechaFinObj.getTime()));
        const diasLaboralesInterseccion = calcularDiasLaboralesPeriodo(inicioInterseccion, finInterseccion);
        
        console.log(`Semana ${pago.id_semana_laboral}: días laborales en la intersección: ${diasLaboralesInterseccion}`);
        
        // Calcular proporción de días que pertenecen al mes consultado
        // Usar las mismas fechas locales ya convertidas arriba
        const totalDiasLaboralesSemana = calcularDiasLaboralesPeriodo(semanaInicioLocal, semanaFinLocal);
        
        if (esGersonRuiz) {
          console.log(`\n🔍 ANÁLISIS DETALLADO SEMANA ${pago.id_semana_laboral} - ${empleado.nombre_completo}`);
          console.log(`Fechas de la semana: ${semanaInicioLocal.toLocaleDateString()} - ${semanaFinLocal.toLocaleDateString()}`);
          console.log(`Total días laborales en la semana: ${totalDiasLaboralesSemana}`);
          console.log(`Días laborales que intersectan con el periodo: ${diasLaboralesInterseccion}`);
          console.log(`Asistencias registradas en la semana: ${pago.dias_completos}`);
        }
        
        // Calcular asistencias proporcionales al mes
        if (pago.dias_completos > 0 && totalDiasLaboralesSemana > 0) {
          // Proporción de la semana que pertenece al mes consultado
          const proporcionEnMes = diasLaboralesInterseccion / totalDiasLaboralesSemana;
          const diasCompletosEnMes = Math.round(pago.dias_completos * proporcionEnMes);
          
          if (esGersonRuiz) {
            console.log(`Proporción de la semana en el mes: ${proporcionEnMes.toFixed(3)} (${diasLaboralesInterseccion}/${totalDiasLaboralesSemana})`);
            console.log(`Cálculo: ${pago.dias_completos} * ${proporcionEnMes.toFixed(3)} = ${(pago.dias_completos * proporcionEnMes).toFixed(2)}`);
            console.log(`Redondeado: ${diasCompletosEnMes} días asignados al mes`);
          }
          
          const asistenciasAntes = asistenciasCount;
          asistenciasCount += diasCompletosEnMes;
          
          if (esGersonRuiz) {
            console.log(`Asistencias antes: ${asistenciasAntes} + ${diasCompletosEnMes} = ${asistenciasCount}`);
          }
        } else if (pago.dias_completos === 0 && esGersonRuiz) {
          console.log(`No hay asistencias en esta semana (${pago.dias_completos} días)`);
        }
        
        // Calcular medios días proporcionales al mes
        if (pago.medio_dias > 0 && totalDiasLaboralesSemana > 0) {
          const proporcionEnMes = diasLaboralesInterseccion / totalDiasLaboralesSemana;
          const mediosDiasEnMes = Math.round(pago.medio_dias * proporcionEnMes);
          
          mediosDiasCount += mediosDiasEnMes;
          console.log(`Medios días en el mes para ${empleado.nombre_completo}: ${mediosDiasEnMes} (de ${pago.medio_dias} totales)`);
        }
      } else {
        // Si no tenemos fechas de semana, usamos los valores directamente pero con advertencia
        console.warn(`Pago ID ${pago.id_pago_personal_semana} sin fechas de semana definidas, usando valores directos`);
        asistenciasCount += pago.dias_completos || 0;
        mediosDiasCount += pago.medio_dias || 0;
      }

      // Sumar montos de cocción (asumimos que todo está en el total_coccion)
      if (pago.total_coccion) {
        totalCoccion += Number(pago.total_coccion);
        coccionesCount += 1; // Incrementamos el contador de cocciones (aproximado)
      }

      // Sumar montos de humeada
      if (pago.total_humeada) {
        totalHumeada += Number(pago.total_humeada);
        humeadasCount += 1; // Incrementamos el contador de humeadas
      }

      // Sumar tareas extras
      if (pago.total_tareas_extra) {
        totalTareasExtras += Number(pago.total_tareas_extra);
        
        // Agregamos una tarea extra "consolidada" por cada pago
        tareasExtrasLista.push({
          id_tarea_extra: pago.id_pago_personal_semana,
          id_personal: idPersonal,
          id_semana_laboral: pago.id_semana_laboral,
          fecha: pago.fecha_pago,
          monto: pago.total_tareas_extra.toString(),
          descripcion: `Tareas extras - Semana ${pago.semana_laboral?.fecha_inicio?.substring(0, 10) ?? 'N/A'} al ${pago.semana_laboral?.fecha_fin?.substring(0, 10) ?? 'N/A'}`,
          created_at: pago.created_at,
          updated_at: pago.updated_at
        });
      }
    });

    if (esGersonRuiz) {
      console.log(`\n📊 RESUMEN FINAL PARA ${empleado.nombre_completo}`);
      console.log(`Total asistencias calculadas: ${asistenciasCount}`);
      console.log(`Total medios días calculados: ${mediosDiasCount}`);
      console.log(`Semanas procesadas: ${Array.from(semanasContabilizadas).join(', ')}`);
      console.log(`============================================\n`);
    }

    // Sumar todos los valores monetarios de todas las semanas del empleado
    let totalPorAsistencias = 0;
    let totalDescuentos = 0;
    let totalAdelantos = 0;
    let totalPagoFinal = 0;
    let costoPagoDiario = 0;
    
    // Sumar valores de todas las semanas para este empleado
    pagosEmpleado.forEach(pago => {
      // Sumar total_asistencia_pago de cada semana
      if (pago.total_asistencia_pago !== undefined) {
        totalPorAsistencias += Number(pago.total_asistencia_pago);
      }
      
      // Sumar descuentos de cada semana
      if (pago.total_descuentos !== undefined) {
        totalDescuentos += Number(pago.total_descuentos);
      }
      
      // Sumar adelantos de cada semana
      if (pago.total_adelantos !== undefined) {
        totalAdelantos += Number(pago.total_adelantos);
      }
      
      // Sumar total_pago_final de cada semana
      if (pago.total_pago_final !== undefined) {
        totalPagoFinal += Number(pago.total_pago_final);
      }
      
      // Obtener el costo_pago_diario (debería ser el mismo en todas las semanas)
      if (pago.costo_pago_diario !== undefined && costoPagoDiario === 0) {
        costoPagoDiario = Number(pago.costo_pago_diario);
      }
    });

    if (esGersonRuiz) {
      console.log(`\n💰 TOTALES MONETARIOS PARA ${empleado.nombre_completo}`);
      console.log(`Total por asistencias (suma de todas las semanas): ${totalPorAsistencias}`);
      console.log(`Total cocción (suma de todas las semanas): ${totalCoccion}`);
      console.log(`Total tareas extras (suma de todas las semanas): ${totalTareasExtras}`);
      console.log(`Total descuentos (suma de todas las semanas): ${totalDescuentos}`);
      console.log(`Total adelantos (suma de todas las semanas): ${totalAdelantos}`);
      console.log(`Total pago final (suma de todas las semanas): ${totalPagoFinal}`);
      console.log(`Costo pago diario: ${costoPagoDiario}`);
      console.log(`============================================\n`);
    }

    console.log(`Totales para ${empleado.nombre_completo}: Asistencias=${totalPorAsistencias}, Cocción=${totalCoccion}, Tareas=${totalTareasExtras}, Descuentos=${totalDescuentos}`);

    // Crear el objeto de reporte para este empleado
    const reporteEmpleado = {
      id_personal: idPersonal,
      nombre_completo: empleado.nombre_completo || 'Sin nombre',
      estado: empleado.estado,
      asistencias: asistenciasCount,
      faltas: faltasCount,
      mediosDias: mediosDiasCount,
      cocciones: coccionesCount,
      totalCoccion: totalCoccion,
      humeadas: humeadasCount,
      totalHumeada: totalHumeada,
      totalAsistencias: totalPorAsistencias,
      tareasExtras: tareasExtrasLista,
      totalTareasExtras: totalTareasExtras,
      totalDescuentos: totalDescuentos,
      totalAdelantos: totalAdelantos,
      totalPagoFinal: totalPagoFinal,
      costoPagoDiario: costoPagoDiario,
      diasLaboralesPeriodo: totalDiasLaboralesPeriodo
    };

    reporte.push(reporteEmpleado);
  });

  console.log(`Reporte generado: ${reporte.length} empleados con pagos procesados`);

  // Calcular el total pagado usando los valores ya calculados
  const total = reporte.reduce((suma, empleado) => {
    // Usar el totalPagoFinal calculado que ya incluye todo
    const totalEmpleado = empleado.totalPagoFinal;
    
    console.log(`Total final para ${empleado.nombre_completo}: ${totalEmpleado} (suma de todas las semanas)`);
    
    return suma + totalEmpleado;
  }, 0);

  setReportePersonal(reporte);
  setTotalPagado(total);

  if (reporte.length === 0) {
    setError("No se encontraron pagos procesados en el periodo seleccionado");
  }
};
