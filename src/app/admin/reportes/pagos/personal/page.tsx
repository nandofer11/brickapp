"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Loader2,
  Check,
  X,
  AlertCircle,
  Flame,
  Wind,
  ClipboardList,
  Printer,
  NotebookPen
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { formatDate } from "@/utils/dateFormat";

// Interfaces según la estructura de las APIs
interface Personal {
  id_personal: number;
  dni: string;
  ruc: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  ciudad: string;
  direccion: string;
  celular: string;
  pago_diario_normal: number;
  pago_diario_reducido: number | null;
  fecha_ingreso: string;
  estado: number;
  id_empresa: number;
  created_at: string;
  updated_at: string;
}

interface Asistencia {
  id_asistencia: number;
  fecha: string;
  id_personal: number;
  id_semana_laboral: number;
  estado: string; // 'A' (asistencia), 'F' (falta), 'M' (medio día)
  created_at: string;
  updated_at: string;
  personal: Personal;
  semana_laboral: SemanaLaboral;
}

interface SemanaLaboral {
  id_semana_laboral: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: number;
  id_empresa: number;
  created_at: string;
  updated_at: string;
}

interface Coccion {
  id_coccion: number;
  semana_laboral_id_semana_laboral: number;
  fecha_encendido: string;
  hora_inicio: string | null;
  fecha_apagado: string | null;
  hora_fin: string | null;
  humedad_inicial: number | null;
  estado: string;
  horno_id_horno: number;
  humeada: boolean;
  quema: boolean;
  hora_inicio_quema: string | null;
  created_at: string;
  updated_at: string;
  id_empresa: number;
  horno: Horno;
  semana_laboral: SemanaLaboral;
}

interface Horno {
  id_horno: number;
  prefijo: string;
  nombre: string;
  cantidad_humeadores: number;
  cantidad_quemadores: number;
  created_at: string;
  updated_at: string;
  id_empresa: number;
}

interface CoccionTurno {
  id_coccion_personal: number;
  coccion_id_coccion: number;
  personal_id_personal: number;
  cargo_coccion_id_cargo_coccion: number;
  fecha: string;
  personal_externo: string | null;
  created_at: string;
  updated_at: string;
  coccion: Coccion;
  cargo_coccion: CargoCocion;
}

interface CargoCocion {
  id_cargo_coccion: number;
  nombre_cargo: string;
  costo_cargo: string;
  created_at: string;
  updated_at: string;
  id_empresa: number;
  id_horno: number;
}

// Nueva interfaz para Tareas Extra
interface TareaExtra {
  id_tarea_extra: number;
  id_personal: number;
  id_semana_laboral: number;
  fecha: string;
  monto: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

// Actualización del interface ReportePersonal
interface ReportePersonal {
  id_personal: number;
  nombre_completo: string;
  estado: number; // 1 = activo, 0 = inactivo
  asistencias: number;
  faltas: number;
  mediosDias: number;
  cocciones: number;
  totalCoccion: number;
  humeadas: number;
  totalHumeada: number;
  tareasExtras: TareaExtra[];
  totalTareasExtras: number;
  costoPagoDiario?: number; // Costo del pago diario
  totalAsistencias: number; // Total calculado por asistencias
}

// Interfaz para la información de la empresa
// interface EmpresaInfo {
//   nombre: string;
//   ruc: string;
//   direccion: string;
// }

export default function Page() {
  // Agregar el contexto de autenticación
  const { empresa } = useAuthContext();

  // Estados para las fechas
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [pagosRealizados, setPagosRealizados] = useState<any[]>([]);
  
  // Estado para el reporte final
  const [reportePersonal, setReportePersonal] = useState<ReportePersonal[]>([]);
  // Estado para el total pagado
  const [totalPagado, setTotalPagado] = useState<number>(0);

  // Estados para los filtros
  const [semanasLaborales, setSemanasLaborales] = useState<SemanaLaboral[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>("");

  // Cargar datos de personal al inicio
  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        setLoading(true);
        console.log("Cargando personal...");
        const response = await fetch('/api/personal');
        if (!response.ok) {
          throw new Error(`Error al cargar personal: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Personal cargado: ${data.length} registros`);

        // Guardar todo el personal para el reporte de pagos
        setPersonal(data);

        // Verificar si hay personal
        if (data.length === 0) {
          setError("No se encontró personal registrado");
        }
      } catch (error) {
        console.error('Error al cargar personal:', error);
        setError(`Error al cargar personal: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonal();
  }, []);

  // Cargar las últimas 4 semanas laborales
  useEffect(() => {
    const fetchSemanasLaborales = async () => {
      try {
        setLoading(true);
        console.log("Cargando semanas laborales...");
        // Agregamos el parámetro limit=4 para obtener solo las últimas 4 semanas
        const response = await fetch('/api/semana_laboral?limit=4');
        if (!response.ok) {
          throw new Error(`Error al cargar semanas laborales: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Semanas laborales cargadas: ${data.length} registros`);

        // Ordenar las semanas por fecha_inicio de más reciente a más antigua
        const semanasOrdenadas = data.sort((a: SemanaLaboral, b: SemanaLaboral) => {
          return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
        });

        setSemanasLaborales(semanasOrdenadas);

        // Verificar si hay semanas
        if (semanasOrdenadas.length === 0) {
          console.warn("No se encontraron semanas laborales");
        }
      } catch (error) {
        console.error('Error al cargar semanas laborales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSemanasLaborales();
  }, []);

  // Manejador para cambio de semana laboral
  const handleSemanaChange = (value: string) => {
    setSemanaSeleccionada(value);
    establecerRangoSegunSemana(value);
  };

  // Función para establecer el rango de fechas según la semana laboral seleccionada
  const establecerRangoSegunSemana = (idSemana: string) => {
    if (!idSemana) return;

    // Guardamos el ID de la semana para usar en la consulta a la API
    setSemanaSeleccionada(idSemana);
    
    const semana = semanasLaborales.find(s => s.id_semana_laboral.toString() === idSemana);
    if (!semana) {
      console.warn(`No se encontró la semana laboral con ID ${idSemana}`);
      return;
    }

    console.log("Semana seleccionada:", semana);
    
    // Usamos directamente las fechas de la semana laboral sin ajustes de zona horaria
    // El formato ISO ya está en UTC y necesitamos extraer solo la parte de fecha
    // Formato YYYY-MM-DD para inputs de tipo date
    const formatoFecha = (fechaStr: string) => {
      // Extraer directamente la parte de fecha del string ISO (primeros 10 caracteres)
      return fechaStr.substring(0, 10);
    };

    const fechaInicio = formatoFecha(semana.fecha_inicio);
    const fechaFin = formatoFecha(semana.fecha_fin);
    
    console.log(`Estableciendo rango de fechas: ${fechaInicio} - ${fechaFin}`);
    
    setFechaInicio(fechaInicio);
    setFechaFin(fechaFin);
  };

  // Función para generar el reporte
  const generarReporte = async () => {
    if (!semanaSeleccionada) {
      toast.error("Seleccione una semana laboral para generar el reporte");
      return;
    }

    setLoading(true);
    setError(null);
    setReportePersonal([]);
    setTotalPagado(0);

    try {
      console.log(`Generando reporte para la semana laboral ID: ${semanaSeleccionada}`);
      
      // Si es filtro por semana, usar el ID de semana directamente
      const url = `/api/pago_personal_semana?id_semana=${semanaSeleccionada}`;
      console.log(`Consultando pagos por ID de semana: ${semanaSeleccionada}`);

      // Obtener pagos realizados
      console.log("Cargando pagos realizados...");
      const responsePagos = await fetch(url);
      if (!responsePagos.ok) {
        throw new Error(`Error al cargar pagos: ${responsePagos.status}`);
      }
      const dataPagos = await responsePagos.json();
      console.log(`Pagos cargados: ${dataPagos.length} registros`);
      setPagosRealizados(dataPagos);

      // Procesar los datos de pagos para mostrarlos en el reporte
      console.log("Procesando datos para el reporte...");
      // Importar y utilizar la función procesarPagosParaReporte
      import('./procesarPagosParaReporte').then(module => {
        module.procesarPagosParaReporte(
          dataPagos,
          personal,
          fechaInicio,
          fechaFin,
          setReportePersonal,
          setTotalPagado,
          setError
        );
      });
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setError(`Error al generar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);

      toast.error("Ocurrió un error al generar el reporte. Inténtelo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos y generar el reporte completo
  const generarReporteCompleto = (
    asistenciasData: Asistencia[] = [],
    coccionesData: Coccion[] = [],
    turnosData: CoccionTurno[] = [],
    tareasExtrasData: TareaExtra[] = []
  ) => {
    // Validar que tengamos personal para procesar
    if (personal.length === 0) {
      console.warn("No hay personal disponible para generar el reporte");
      setError("No hay personal disponible para generar el reporte");
      return;
    }

    console.log(`Generando reporte para ${personal.length} personas`);

    // Convertir fechas de inicio y fin para comparación
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    // Asegurarse que las fechas son válidas
    if (isNaN(fechaInicioObj.getTime()) || isNaN(fechaFinObj.getTime())) {
      console.error("Fechas de inicio o fin inválidas");
      setError("Rango de fechas inválido");
      return;
    }

    console.log(`Rango de fechas: ${fechaInicioObj.toISOString()} hasta ${fechaFinObj.toISOString()}`);
    console.log(`Rango de fechas (formato humano): ${fechaInicio} hasta ${fechaFin}`);

    // Filtrar asistencias por rango de fechas primero
    const asistenciasFiltradas = Array.isArray(asistenciasData)
      ? asistenciasData.filter(a => {
        if (!a || !a.fecha) return false;
        const fechaAsistencia = new Date(a.fecha);
        fechaAsistencia.setHours(0, 0, 0, 0);
        const fechaInicioAjustada = new Date(fechaInicioObj);
        fechaInicioAjustada.setHours(0, 0, 0, 0);
        const fechaFinAjustada = new Date(fechaFinObj);
        fechaFinAjustada.setHours(23, 59, 59, 999);
        return fechaAsistencia >= fechaInicioAjustada && fechaAsistencia <= fechaFinAjustada;
      })
      : [];

    // Filtrar tareas extras por rango de fechas
    const tareasExtrasFiltradas = Array.isArray(tareasExtrasData)
      ? tareasExtrasData.filter(t => {
        if (!t || !t.fecha) return false;
        const fechaTarea = new Date(t.fecha);
        // Ajustar la fecha para comparación (establecer hora a 00:00:00)
        fechaTarea.setHours(0, 0, 0, 0);
        const fechaInicioAjustada = new Date(fechaInicioObj);
        fechaInicioAjustada.setHours(0, 0, 0, 0);
        const fechaFinAjustada = new Date(fechaFinObj);
        fechaFinAjustada.setHours(23, 59, 59, 999);
        return fechaTarea >= fechaInicioAjustada && fechaTarea <= fechaFinAjustada;
      })
      : [];

    console.log(`Asistencias filtradas por fecha: ${asistenciasFiltradas.length} de ${asistenciasData.length}`);
    console.log(`Tareas extras filtradas por fecha: ${tareasExtrasFiltradas.length} de ${tareasExtrasData.length}`);
    console.log(`Rango de fechas ajustado para comparación: ${new Date(fechaInicioObj).setHours(0,0,0,0)} hasta ${new Date(fechaFinObj).setHours(23,59,59,999)}`);

    // Crear un reporte para cada persona
    const reporte = personal.map(persona => {
      // Filtrar asistencias por persona y fecha
      const asistenciasPersona = asistenciasFiltradas.filter(a => a.id_personal === persona.id_personal);

      // Contar tipos de asistencia
      const asistenciasCount = asistenciasPersona.filter(a => a.estado === 'A').length;
      const faltasCount = asistenciasPersona.filter(a => a.estado === 'I').length; // Inasistencia
      const mediosDiasCount = asistenciasPersona.filter(a => a.estado === 'M').length;

      console.log(`${persona.nombre_completo}: A=${asistenciasCount}, F=${faltasCount}, M=${mediosDiasCount}`);

      // Filtrar tareas extras por persona
      const tareasExtrasPersona = tareasExtrasFiltradas.filter(t => t.id_personal === persona.id_personal);
      const totalTareasExtras = tareasExtrasPersona.reduce((total, tarea) => total + parseFloat(tarea.monto || '0'), 0);

      console.log(`${persona.nombre_completo}: ${tareasExtrasPersona.length} tareas extras, total S/. ${totalTareasExtras.toFixed(2)}`);

      // Filtra los turnos de cocción por rango de fechas y persona
      const turnosPersonaFiltrados = Array.isArray(turnosData)
        ? turnosData.filter(t => {
          if (!t || !t.fecha || t.personal_id_personal !== persona.id_personal) return false;
          const fechaTurno = new Date(t.fecha);
          return fechaTurno >= fechaInicioObj && fechaTurno <= fechaFinObj;
        })
        : [];

      // Contar cocciones y humeadas
      const coccionesIds = new Set<number>();
      const hummeadasIds = new Set<number>();
      let totalCoccion = 0;
      let totalHumeada = 0;

      // Procesar cada turno para contar cocciones únicas y calcular totales
      turnosPersonaFiltrados.forEach(turno => {
        try {
          const coccionId = turno.coccion_id_coccion;

          if (!coccionId) {
            console.warn(`Turno sin ID de cocción: ${JSON.stringify(turno)}`);
            return;
          }

          const coccion = Array.isArray(coccionesData)
            ? coccionesData.find(c => c && c.id_coccion === coccionId)
            : undefined;

          if (!coccion) {
            console.warn(`No se encontró cocción con ID ${coccionId}`);
            return;
          }

          // Verificar si la cocción está dentro del rango de fechas
          if (coccion.fecha_encendido) {
            const fechaCoccion = new Date(coccion.fecha_encendido);
            if (fechaCoccion < fechaInicioObj || fechaCoccion > fechaFinObj) {
              console.log(`Cocción ${coccionId} fuera del rango de fechas`);
              return;
            }
          }

          // Contar cocción
          coccionesIds.add(coccionId);

          // Validar que el cargo de cocción tenga un costo
          if (!turno.cargo_coccion || !turno.cargo_coccion.costo_cargo) {
            console.warn(`Turno sin costo de cargo: ${JSON.stringify(turno)}`);
            return;
          }

          // Sumar costo del cargo
          const costoCargo = parseFloat(turno.cargo_coccion.costo_cargo) || 0;

          // Verificar si es un cargo de humeador por el nombre del cargo
          const nombreCargo = turno.cargo_coccion.nombre_cargo?.toLowerCase() || '';

          if (nombreCargo.includes('humeador')) {
            // Es un turno de humeada
            hummeadasIds.add(coccionId);
            totalHumeada += costoCargo;
          } else {
            // Es un turno de cocción/quemador
            coccionesIds.add(coccionId);
            totalCoccion += costoCargo;
          }
        } catch (error) {
          console.error('Error procesando turno:', error);
        }
      });

      // Agregar costoPagoDiario al objeto para cumplir con la interfaz
      const costoPagoDiario = persona.pago_diario_normal || 0;

      return {
        id_personal: persona.id_personal,
        nombre_completo: persona.nombre_completo,
        estado: persona.estado,
        asistencias: asistenciasCount,
        faltas: faltasCount,
        mediosDias: mediosDiasCount,
        cocciones: coccionesIds.size,
        totalCoccion: totalCoccion,
        humeadas: hummeadasIds.size,
        totalHumeada: totalHumeada,
        tareasExtras: tareasExtrasPersona,
        totalTareasExtras: totalTareasExtras,
        costoPagoDiario: costoPagoDiario // <-- propiedad agregada
      };
    });

    console.log(`Reporte generado: ${reporte.length} registros`);

    // Filtrar solo el personal que tiene alguna actividad en el período
    const reporteFiltrado = reporte.filter(persona =>
      persona.asistencias > 0 ||
      persona.mediosDias > 0 ||
      persona.cocciones > 0 ||
      persona.humeadas > 0 ||
      persona.tareasExtras.length > 0
    );

    console.log(`Reporte filtrado: ${reporteFiltrado.length} registros con actividad`);

    // Asegurarnos que todos los registros tengan los campos requeridos
    const reporteCompleto = reporteFiltrado.map(persona => {
      // Obtener el valor del costoPagoDiario si no está definido
      const costoPagoDiario = persona.costoPagoDiario || 
        (personal.find(p => p.id_personal === persona.id_personal)?.pago_diario_normal || 0);
      
      // Calcular totalAsistencias usando asistencias y mediosDias
      const totalAsistencias = ((persona.asistencias * costoPagoDiario) + (persona.mediosDias * costoPagoDiario * 0.5));
      
      return {
        ...persona,
        costoPagoDiario,
        totalAsistencias
      };
    });

    // Calcular el total pagado sumando el Total Final de cada persona (que ya incluye descuentos)
    const total = reporteCompleto.reduce((suma, persona) => {
      // Obtener el total de descuentos
      const totalDescuentos = Number(pagosRealizados.find(p => p.id_personal === persona.id_personal && 
            p.id_semana_laboral.toString() === semanaSeleccionada)?.total_descuentos || 0);
      
      // Calcular el total final (igual que en la tabla)
      const totalFinal = persona.totalAsistencias + persona.totalCoccion + 
                         persona.totalHumeada + persona.totalTareasExtras - totalDescuentos;
      
      return suma + totalFinal;
    }, 0);

    setReportePersonal(reporteCompleto);
    setTotalPagado(total);

    if (reporteFiltrado.length === 0) {
      setError("No se encontraron datos para generar el reporte");
    }
  };

  // Estado para el modal de detalle
  const [detalleModalOpen, setDetalleModalOpen] = useState<boolean>(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<ReportePersonal | null>(null);

  // Referencia para la impresión
  const impresionRef = useRef<HTMLDivElement>(null);

  // Fecha y hora actual formateada
  const obtenerFechaHoraActual = () => {
    const ahora = new Date();
    return ahora.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Función para imprimir el reporte
  const imprimirReporte = () => {
    if (!empleadoSeleccionado || !impresionRef.current) {
      toast.error("No se puede imprimir el reporte");
      return;
    }

    try {
      toast.info("Preparando documento para impresión...");

      // Enfoque más simple: modificar los estilos temporalmente y usar window.print()
      const originalContents = document.body.innerHTML;

      // Crear una página de impresión con sólo el contenido que nos interesa
      const printContent = impresionRef.current.innerHTML;
      const printStyles = `
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      width: 76mm;
      margin: 0;
      padding: 2mm;
    }
    .text-center { text-align: center; }
    .mb-0 { margin-bottom: 0; }
    .mb-1 { margin-bottom: 1mm; }
    .mb-2 { margin-bottom: 2mm; }
    .pb-1 { padding-bottom: 1mm; }
    .pb-2 { padding-bottom: 2mm; }
    .pt-1 { padding-top: 1mm; }
    .pt-2 { padding-top: 2mm; }
    .border-t { border-top: 1px solid #ccc; }
    .border-b { border-bottom: 1px solid #ccc; }
    .font-bold { font-weight: bold; }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 8px; }
    .text-sm { font-size: 10px; }
    .text-base { font-size: 12px; }
    .text-right { text-align: right; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    .gap-1 { gap: 1mm; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1mm 0; text-align: left; }
    p { margin: 0.5mm 0; }
    .mt-1 { margin-top: 1mm; }
    .mt-2 { margin-top: 2mm; }
    .mt-3 { margin-top: 3mm; }
    .mt-5 { margin-top: 5mm; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .w-32 { width: 32mm; }
  </style>
`;

      // Crear una nueva ventana para la impresión
      const printWindow = window.open('', '_blank', 'height=600,width=800');

      if (!printWindow) {
        toast.error("Por favor, permita ventanas emergentes para imprimir");
        return;
      }

      printWindow.document.write('<html><head><title>Reporte de Pagos</title>');
      printWindow.document.write(printStyles);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');

      printWindow.document.close();
      printWindow.focus();

      // Esperar a que cargue todos los recursos antes de imprimir
      setTimeout(() => {
        printWindow.print();
        // No cerramos automáticamente la ventana para que el usuario pueda ver el reporte
        // printWindow.close();
      }, 500);

    } catch (error) {
      console.error("Error al imprimir:", error);
      toast.error("Error al preparar la impresión");
    }
  };

  // Función para ver el detalle de un empleado
  const verDetalle = (id: number) => {
    const empleado = reportePersonal.find(p => p.id_personal === id);

    if (empleado) {
      // Verificar y ajustar valores por defecto para evitar errores
      const empleadoValidado = {
        ...empleado,
        // Asegurar que los valores numéricos sean números válidos
        cocciones: empleado.cocciones || 0,
        humeadas: empleado.humeadas || 0,
        totalCoccion: empleado.totalCoccion || 0,
        totalHumeada: empleado.totalHumeada || 0,
        tareasExtras: empleado.tareasExtras || [],
        totalTareasExtras: empleado.totalTareasExtras || 0,
        costoPagoDiario: empleado.costoPagoDiario || 0
      };
      
      setEmpleadoSeleccionado(empleadoValidado);
      setDetalleModalOpen(true);
      console.log(`Mostrando detalle del empleado ID: ${id}`, empleadoValidado);
    } else {
      toast.error(`No se encontró información para el empleado ID: ${id}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reporte de Pagos</CardTitle>
          <CardDescription>
            Seleccione un filtro de búsqueda y genere el reporte para visualizar la información
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros en una sola fila con flexbox responsivo */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-6">
            {/* Selector de semana laboral */}
            <div className="w-full md:w-72">
              <Label htmlFor="semana-select" className="block mb-2">Seleccione Semana Laboral</Label>
              <Select value={semanaSeleccionada} onValueChange={handleSemanaChange}>
                <SelectTrigger id="semana-select">
                  <SelectValue placeholder="Seleccionar semana" />
                </SelectTrigger>
                <SelectContent>
                  {semanasLaborales.map((semana) => {
                    // Usar la función formatDate para mostrar fechas en formato DD/MM/YYYY
                    return (
                      <SelectItem key={semana.id_semana_laboral} value={semana.id_semana_laboral.toString()}>
                        Semana: {formatDate(semana.fecha_inicio)} - {formatDate(semana.fecha_fin)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Botón generar reporte */}
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <Button onClick={generarReporte} disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Generar Reporte'
                )}
              </Button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {/* Tabla de reporte */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personal</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Check className="h-4 w-4 text-green-600" />
                      Asistencias
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Medio Días
                    </div>
                  </TableHead>
                  <TableHead className="text-center">S/. Asistencias</TableHead>
                  <TableHead className="text-center">S/. Cocción</TableHead>
                  <TableHead className="text-center">S/. Tareas Extra</TableHead>
                  <TableHead className="text-center">S/. Descuentos</TableHead>
                  <TableHead className="text-center">S/. Total Final</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportePersonal.length > 0 ? (
                  reportePersonal.map((persona) => (
                    <TableRow key={persona.id_personal}>
                      <TableCell>{persona.nombre_completo}</TableCell>
                      <TableCell className="text-center">
                        {persona.estado === 1 ? (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{persona.asistencias}</TableCell>
                      <TableCell className="text-center">{persona.mediosDias}</TableCell>
                      <TableCell className="text-center">
                        S/. {(()=>{
                          // Mostrar total de asistencias directamente del objeto reportePersonal
                          return persona.totalAsistencias.toFixed(2);
                        })()}
                      </TableCell>
                      <TableCell className="text-center">S/. {persona.totalCoccion.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        S/. {persona.totalTareasExtras.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        S/. {(pagosRealizados.find(p => p.id_personal === persona.id_personal && 
                                p.id_semana_laboral.toString() === semanaSeleccionada)?.total_descuentos || "0").toString()}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        S/. {(()=>{
                          // Obtener el total de descuentos
                          const totalDescuentos = Number(pagosRealizados.find(p => p.id_personal === persona.id_personal && 
                                p.id_semana_laboral.toString() === semanaSeleccionada)?.total_descuentos || 0);
                          
                          // Calcular el total final usando totalAsistencias directamente
                          return (persona.totalAsistencias + persona.totalCoccion + persona.totalHumeada + persona.totalTareasExtras - totalDescuentos).toFixed(2);
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => verDetalle(persona.id_personal)}
                          title="Ver Detalle"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6">
                      {loading ? (
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                          Cargando datos...
                        </div>
                      ) : (
                        'Seleccione su filtro de búsqueda y genere reporte'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Card para el Total Pagado */}
          {reportePersonal.length > 0 && (
            <div className="mt-6">
              <Card className="bg-gray-50 py-3">
                <CardContent className="">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold">Total Pagado:</h3>
                      <p className="text-sm text-gray-600">
                        Semana: {formatDate(fechaInicio)} - {formatDate(fechaFin)}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          Activos: {reportePersonal.filter(p => p.estado === 1).length}
                        </span>
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          Inactivos: {reportePersonal.filter(p => p.estado === 0).length}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">S/. {totalPagado.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{reportePersonal.length} empleados en total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Información de depuración en desarrollo */}
          {/* 
{process.env.NODE_ENV === 'development' && (
  <div className="mt-6 p-4 bg-gray-50 rounded-md text-xs">
    <p><strong>Depuración:</strong></p>
    <p>Personal cargado: {personal.length}</p>
    <p>Asistencias: {asistencias.length}</p>
    <p>Cocciones: {cocciones.length}</p>
    <p>Turnos: {coccionTurnos.length}</p>
    <p>Tareas extras: {tareasExtras.length}</p>
    <p>Filtro: {tipoFiltro === "rango"
      ? `Rango (${fechaInicio} al ${fechaFin})`
      : `Mes (${mesSeleccionado})`}
    </p>
    <p>Registros reporte: {reportePersonal.length}</p>
    <p>Personal activo: {reportePersonal.filter(p => p.estado === 1).length}</p>
    <p>Personal inactivo: {reportePersonal.filter(p => p.estado === 0).length}</p>
    <p>Total pagado: S/. {totalPagado.toFixed(2)}</p>
  </div>
)}
*/}
        </CardContent>
      </Card>

      {/* Modal de Detalle */}
      <Dialog open={detalleModalOpen} onOpenChange={setDetalleModalOpen}>
        <DialogContent className="max-w-[380px] max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="pb-2 mb-2 border-b">
            <DialogTitle className="text-base font-bold text-center">
              Detalle del Reporte
            </DialogTitle>
          </DialogHeader>

          {/* Contenido imprimible - Mantener la estructura pero simplificar las clases */}
          <div id="imprimible-contenido" ref={impresionRef} className="p-3">
            {/* Cabecera con información de la empresa desde el contexto */}
            <div className="text-center border-b pb-2 mb-2 text-sm">
              <p className="font-bold mb-0">{empresa?.razon_social || 'Empresa'}</p>
              <p className="text-xs mb-0">RUC: {empresa?.ruc || '00000000000'}</p>
              <p className="text-xs mb-1">{empresa?.direccion || 'Dirección'}</p>
              <p className="text-sm font-semibold">Reporte de Pagos</p>
            </div>

            {/* Información general del reporte */}
            <div className="mb-2 text-xs">
              <div>
                <span><strong>Fecha:</strong> {obtenerFechaHoraActual().split(',')[0]}</span>
              </div>
              <div>
                <span><strong>Periodo:</strong> Semana: {formatDate(fechaInicio)} - {formatDate(fechaFin)}</span>
              </div>
            </div>

            {/* Información del empleado - Más compacta */}
            {empleadoSeleccionado && (
                <div className="text-sm">
                  <div className="border-b pb-2 mb-2">
                    <p className="font-semibold mb-0">{empleadoSeleccionado.nombre_completo}</p>
                    <div className="flex items-center">
                      <p className="text-xs mb-0 mr-2">DNI: {personal.find(p => p.id_personal === empleadoSeleccionado.id_personal)?.dni || 'N/A'}</p>
                      {empleadoSeleccionado.estado === 1 ? (
                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs">Costo diario pagado: S/. {(empleadoSeleccionado.costoPagoDiario !== undefined ? empleadoSeleccionado.costoPagoDiario : 0).toFixed(2)}</p>
                  </div>                {/* Detalle más compacto */}
                <div className="mb-2">
                  <p className="font-semibold mb-1 border-b pb-1 text-xs">ASISTENCIAS</p>
                  <div className="grid grid-cols-2 text-xs gap-1">
                    <p className="mb-0">Días laborables:</p>
                    <p className="mb-0 text-right">{empleadoSeleccionado.asistencias + empleadoSeleccionado.faltas + empleadoSeleccionado.mediosDias}</p>
                    <p className="mb-0">Asistencias:</p>
                    <p className="mb-0 text-right">{empleadoSeleccionado.asistencias}</p>
                    <p className="mb-0">Faltas:</p>
                    <p className="mb-0 text-right">{empleadoSeleccionado.faltas}</p>
                    <p className="mb-0">Medio Días:</p>
                    <p className="mb-0 text-right">{empleadoSeleccionado.mediosDias}</p>
                    <p className="mb-0 font-semibold">Pago asistencias:</p>
                    <p className="mb-0 text-right font-semibold">S/. {(() => {
                      // Usar totalAsistencias directamente
                      return empleadoSeleccionado.totalAsistencias.toFixed(2);
                    })()}</p>
                  </div>
                </div>

                {/* Sección de servicios - solo mostrar si hay servicios */}
                {(empleadoSeleccionado.totalCoccion > 0 || empleadoSeleccionado.totalHumeada > 0) && (
                  <div className="mb-2">
                    <p className="font-semibold mb-1 border-b pb-1 text-xs">SERVICIOS</p>
                    <div className="grid grid-cols-2 text-xs gap-1">
                      {empleadoSeleccionado.totalCoccion > 0 && (
                        <>
                          <p className="mb-0 font-semibold">Total cocción:</p>
                          <p className="mb-0 text-right font-semibold">S/. {empleadoSeleccionado.totalCoccion.toFixed(2)}</p>
                        </>
                      )}
                      {empleadoSeleccionado.totalHumeada > 0 && (
                        <>
                          <p className="mb-0 font-semibold">Total humeada:</p>
                          <p className="mb-0 text-right font-semibold">S/. {empleadoSeleccionado.totalHumeada.toFixed(2)}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tareas extras - solo mostrar si hay tareas extras válidas */}
                {empleadoSeleccionado.totalTareasExtras > 0 && (
                  <div className="mb-2">
                    <p className="font-semibold mb-1 border-b pb-1 text-xs">TAREAS EXTRAS</p>
                    <div className="grid grid-cols-2 text-xs gap-1">
                      <p className="mb-0 font-semibold">Total tareas extras:</p>
                      <p className="mb-0 text-right font-semibold">S/. {empleadoSeleccionado.totalTareasExtras.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Resumen de pagos */}
                <div className="mb-2 mt-3 pt-2 border-t">
                  <p className="font-semibold mb-1 text-xs text-center">RESUMEN DE PAGOS</p>
                  <div className="grid grid-cols-2 text-xs gap-1">
                    {(() => {
                      // Usar el costoPagoDiario del empleado seleccionado
                      const pagoDiario = empleadoSeleccionado.costoPagoDiario || 0;
                      
                      // Calcular el pago por asistencias correctamente
                      const pagoAsistencias = (empleadoSeleccionado.asistencias * pagoDiario) + (empleadoSeleccionado.mediosDias * pagoDiario * 0.5);
                      
                      // Obtener datos del pago realizado si existe
                      const pagoRealizado = pagosRealizados.find(p => 
                        p.id_personal === empleadoSeleccionado.id_personal && 
                        p.id_semana_laboral.toString() === semanaSeleccionada
                      );
                      
                      // Obtener el total de descuentos (0 si no existe)
                      const totalDescuentos = Number(pagoRealizado?.total_descuentos || 0);
                      
                      // Calcular el total general
                      const totalGeneral = pagoAsistencias + empleadoSeleccionado.totalCoccion + 
                                          empleadoSeleccionado.totalHumeada + empleadoSeleccionado.totalTareasExtras - 
                                          totalDescuentos;

                      return (
                        <>
                          <p className="mb-0">Por asistencias:</p>
                          <p className="mb-0 text-right">S/. {pagoAsistencias.toFixed(2)}</p>
                          {empleadoSeleccionado.cocciones > 0 && (
                            <>
                              <p className="mb-0">Por cocción:</p>
                              <p className="mb-0 text-right">S/. {empleadoSeleccionado.totalCoccion.toFixed(2)}</p>
                            </>
                          )}
                          {empleadoSeleccionado.humeadas > 0 && (
                            <>
                              <p className="mb-0">Por humeada:</p>
                              <p className="mb-0 text-right">S/. {empleadoSeleccionado.totalHumeada.toFixed(2)}</p>
                            </>
                          )}
                          {empleadoSeleccionado.tareasExtras && empleadoSeleccionado.tareasExtras.length > 0 && (
                            <>
                              <p className="mb-0">Por tareas extras:</p>
                              <p className="mb-0 text-right">S/. {empleadoSeleccionado.totalTareasExtras.toFixed(2)}</p>
                            </>
                          )}
                          <p className="mb-0 text-red-600">Descuentos:</p>
                          <p className="mb-0 text-right text-red-600">-S/. {totalDescuentos.toFixed(2)}</p>
                          <p className="font-bold text-sm border-t pt-1 mt-1">TOTAL PAGADO:</p>
                          <p className="font-bold text-sm text-right border-t pt-1 mt-1">S/. {totalGeneral.toFixed(2)}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Línea de firma */}
                <div className="mt-5 pt-4 border-t text-center text-xs">
                  <div className="border-t w-32 mx-auto pt-1">Firma</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-2 mt-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setDetalleModalOpen(false)}>
              Cerrar
            </Button>
            <Button size="sm" onClick={imprimirReporte} className="flex items-center">
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
