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
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [cocciones, setCocciones] = useState<Coccion[]>([]);
  const [coccionTurnos, setCoccionTurnos] = useState<CoccionTurno[]>([]);
  const [tareasExtras, setTareasExtras] = useState<TareaExtra[]>([]);

  // Estado para el reporte final
  const [reportePersonal, setReportePersonal] = useState<ReportePersonal[]>([]);
  // Estado para el total pagado
  const [totalPagado, setTotalPagado] = useState<number>(0);

  // Nuevo estado para filtro por mes
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("");
  const [tipoFiltro, setTipoFiltro] = useState<"rango" | "mes">("rango");

  // Opciones para el select de meses
  const meses = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

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

  // Función para establecer el rango de fechas según el mes seleccionado
  const establecerRangoSegunMes = (mes: string) => {
    if (!mes) return;

    const year = new Date().getFullYear();
    const primerDia = new Date(year, parseInt(mes) - 1, 1);
    const ultimoDia = new Date(year, parseInt(mes), 0);

    const formatoFecha = (fecha: Date) => {
      return fecha.toISOString().split('T')[0];
    };

    setFechaInicio(formatoFecha(primerDia));
    setFechaFin(formatoFecha(ultimoDia));
  };

  // Manejador para cambio de mes
  const handleMesChange = (value: string) => {
    setMesSeleccionado(value);
    establecerRangoSegunMes(value);
  };

  // Función para generar el reporte
  const generarReporte = async () => {
    if (tipoFiltro === "rango" && (!fechaInicio || !fechaFin)) {
      toast.error("Seleccione un rango de fechas válido");
      return;
    }

    if (tipoFiltro === "mes" && !mesSeleccionado) {
      toast.error("Seleccione un mes para generar el reporte");
      return;
    }

    setLoading(true);
    setError(null);
    setReportePersonal([]);
    setTotalPagado(0);

    try {
      console.log(`Generando reporte desde ${fechaInicio} hasta ${fechaFin}`);

      // 1. Obtener asistencias por rango de fechas
      console.log("Cargando asistencias...");
      const responseAsistencias = await fetch(`/api/asistencia?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (!responseAsistencias.ok) {
        throw new Error(`Error al cargar asistencias: ${responseAsistencias.status}`);
      }
      const dataAsistencias = await responseAsistencias.json();
      console.log(`Asistencias cargadas: ${dataAsistencias.length} registros`);
      setAsistencias(dataAsistencias);

      // 2. Obtener cocciones por rango de fechas
      console.log("Cargando cocciones...");
      const responseCocciones = await fetch(`/api/coccion?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (!responseCocciones.ok) {
        throw new Error(`Error al cargar cocciones: ${responseCocciones.status}`);
      }
      const dataCocciones = await responseCocciones.json();
      console.log(`Cocciones cargadas: ${dataCocciones.length} registros`);
      setCocciones(dataCocciones);

      // 3. Obtener información de turnos de cocción
      console.log("Cargando turnos de cocción...");
      const responseCoccionTurnos = await fetch(`/api/coccion_turno?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (!responseCoccionTurnos.ok) {
        throw new Error(`Error al cargar turnos: ${responseCoccionTurnos.status}`);
      }
      const dataCoccionTurnos = await responseCoccionTurnos.json();
      console.log(`Turnos cargados: ${dataCoccionTurnos.length} registros`);
      setCoccionTurnos(dataCoccionTurnos);

      // 4. Obtener tareas extras por rango de fechas
      console.log("Cargando tareas extras...");
      const responseTareasExtras = await fetch(`/api/tarea_extra?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      if (!responseTareasExtras.ok) {
        throw new Error(`Error al cargar tareas extras: ${responseTareasExtras.status}`);
      }
      const dataTareasExtras = await responseTareasExtras.json();
      console.log(`Tareas extras cargadas: ${dataTareasExtras.length} registros`);
      setTareasExtras(dataTareasExtras);

      // 5. Generar el reporte con todos los datos
      console.log("Procesando datos para el reporte...");
      generarReporteCompleto(dataAsistencias, dataCocciones, dataCoccionTurnos, dataTareasExtras);
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

    // Filtrar asistencias por rango de fechas primero
    const asistenciasFiltradas = Array.isArray(asistenciasData)
      ? asistenciasData.filter(a => {
        if (!a || !a.fecha) return false;
        const fechaAsistencia = new Date(a.fecha);
        return fechaAsistencia >= fechaInicioObj && fechaAsistencia <= fechaFinObj;
      })
      : [];

    // Filtrar tareas extras por rango de fechas
    const tareasExtrasFiltradas = Array.isArray(tareasExtrasData)
      ? tareasExtrasData.filter(t => {
        if (!t || !t.fecha) return false;
        const fechaTarea = new Date(t.fecha);
        return fechaTarea >= fechaInicioObj && fechaTarea <= fechaFinObj;
      })
      : [];

    console.log(`Asistencias filtradas por fecha: ${asistenciasFiltradas.length} de ${asistenciasData.length}`);
    console.log(`Tareas extras filtradas por fecha: ${tareasExtrasFiltradas.length} de ${tareasExtrasData.length}`);

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
        totalTareasExtras: totalTareasExtras
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

    // Calcular el total pagado
    const total = reporteFiltrado.reduce((suma, persona) => {
      const pagoDiario = personal.find(p => p.id_personal === persona.id_personal)?.pago_diario_normal || 0;
      const pagoAsistencias = (persona.asistencias * pagoDiario) + (persona.mediosDias * pagoDiario * 0.5);
      const totalPersona = pagoAsistencias + persona.totalCoccion + persona.totalHumeada + persona.totalTareasExtras;
      return suma + totalPersona;
    }, 0);

    setReportePersonal(reporteFiltrado);
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
      setEmpleadoSeleccionado(empleado);
      setDetalleModalOpen(true);
      console.log(`Mostrando detalle del empleado ID: ${id}`);
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
            {/* Tipo de filtro como grupo de radio buttons */}
            <div className="w-full md:w-auto">
              <Label className="block mb-2">Tipo de filtro:</Label>
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="filtro-rango"
                    name="tipo-filtro"
                    checked={tipoFiltro === "rango"}
                    onChange={() => setTipoFiltro("rango")}
                    className="mr-2"
                  />
                  <Label htmlFor="filtro-rango">Por rango de fechas</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="filtro-mes"
                    name="tipo-filtro"
                    checked={tipoFiltro === "mes"}
                    onChange={() => setTipoFiltro("mes")}
                    className="mr-2"
                  />
                  <Label htmlFor="filtro-mes">Por mes</Label>
                </div>
              </div>
            </div>

            {/* Selector de fechas o mes dependiendo del filtro seleccionado */}
            {tipoFiltro === "rango" ? (
              <>
                <div className="w-full md:w-auto flex-1 flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="fechaInicio" className="block mb-2">Fecha Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="fechaFin" className="block mb-2">Fecha Fin</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full md:w-40">
                <Label htmlFor="mes-select" className="block mb-2">Seleccione Mes</Label>
                <Select value={mesSeleccionado} onValueChange={handleMesChange}>
                  <SelectTrigger id="mes-select">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                      <X className="h-4 w-4 text-red-600" />
                      Faltas
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Medio Días
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="h-4 w-4 text-orange-600" />
                      Quemas
                    </div>
                  </TableHead>
                  <TableHead className="text-center">S/. Cocción</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Wind className="h-4 w-4 text-blue-600" />
                      Humeadas
                    </div>
                  </TableHead>
                  <TableHead className="text-center">S/. Humeada</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                      Tarea Extra
                    </div>
                  </TableHead>
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
                      <TableCell className="text-center">{persona.faltas}</TableCell>
                      <TableCell className="text-center">{persona.mediosDias}</TableCell>
                      <TableCell className="text-center">{persona.cocciones}</TableCell>
                      <TableCell className="text-center">S/. {persona.totalCoccion.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{persona.humeadas}</TableCell>
                      <TableCell className="text-center">S/. {persona.totalHumeada.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {persona.tareasExtras && persona.tareasExtras.length > 0
                          ? `S/. ${persona.totalTareasExtras.toFixed(2)}`
                          : "-"}
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
                        {tipoFiltro === "rango"
                          ? `Periodo: ${fechaInicio} al ${fechaFin}`
                          : `Mes: ${meses.find(m => m.value === mesSeleccionado)?.label || ''} ${new Date().getFullYear()}`
                        }
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
                <span><strong>Periodo:</strong> {tipoFiltro === "rango"
                  ? `${fechaInicio} - ${fechaFin}`
                  : `${meses.find(m => m.value === mesSeleccionado)?.label || mesSeleccionado}`}
                </span>
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
                  <p className="text-xs">Pago diario: S/. {Number(personal.find(p => p.id_personal === empleadoSeleccionado.id_personal)?.pago_diario_normal).toFixed(2) || '0.00'}</p>
                </div>

                {/* Detalle más compacto */}
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
                      const pagoDiario = personal.find(p => p.id_personal === empleadoSeleccionado.id_personal)?.pago_diario_normal || 0;
                      return ((empleadoSeleccionado.asistencias * pagoDiario) + (empleadoSeleccionado.mediosDias * pagoDiario * 0.5)).toFixed(2);
                    })()}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="font-semibold mb-1 border-b pb-1 text-xs">SERVICIOS</p>
                  <div className="grid grid-cols-2 text-xs gap-1">
                    <p className="mb-0">Quemas:</p>
                    <p className="mb-0 text-right">{empleadoSeleccionado.cocciones}</p>
                    <p className="mb-0">Humeadas:</p>
                    <p className="mb-0 text-right">{empleadoSeleccionado.humeadas}</p>
                    <p className="mb-0 font-semibold">Total quemas:</p>
                    <p className="mb-0 text-right font-semibold">S/. {empleadoSeleccionado.totalCoccion.toFixed(2)}</p>
                    <p className="mb-0 font-semibold">Total humeadas:</p>
                    <p className="mb-0 text-right font-semibold">S/. {empleadoSeleccionado.totalHumeada.toFixed(2)}</p>
                  </div>
                </div>

                {/* Tareas extras */}
                {empleadoSeleccionado.tareasExtras && empleadoSeleccionado.tareasExtras.length > 0 && (
                  <div className="mb-2">
                    <p className="font-semibold mb-1 border-b pb-1 text-xs">TAREAS EXTRAS</p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left font-medium">Fecha</th>
                          <th className="text-left font-medium">Desc.</th>
                          <th className="text-right font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empleadoSeleccionado.tareasExtras.map((tarea) => (
                          <tr key={tarea.id_tarea_extra}>
                            <td>{new Date(tarea.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</td>
                            <td>{tarea.descripcion.substring(0, 15)}{tarea.descripcion.length > 15 ? '...' : ''}</td>
                            <td className="text-right">{parseFloat(tarea.monto).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={2} className="text-right font-semibold">Total:</td>
                          <td className="text-right font-semibold">S/. {empleadoSeleccionado.totalTareasExtras.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Resumen de pagos */}
                <div className="mb-2 mt-3 pt-2 border-t">
                  <p className="font-semibold mb-1 text-xs text-center">RESUMEN DE PAGOS</p>
                  <div className="grid grid-cols-2 text-xs gap-1">
                    {(() => {
                      const pagoDiario = personal.find(p => p.id_personal === empleadoSeleccionado.id_personal)?.pago_diario_normal || 0;
                      const pagoAsistencias = (empleadoSeleccionado.asistencias * pagoDiario) + (empleadoSeleccionado.mediosDias * pagoDiario * 0.5);
                      const totalGeneral = pagoAsistencias + empleadoSeleccionado.totalCoccion + empleadoSeleccionado.totalHumeada + empleadoSeleccionado.totalTareasExtras;

                      return (
                        <>
                          <p className="mb-0">Por asistencias:</p>
                          <p className="mb-0 text-right">S/. {pagoAsistencias.toFixed(2)}</p>
                          <p className="mb-0">Por cocción:</p>
                          <p className="mb-0 text-right">S/. {empleadoSeleccionado.totalCoccion.toFixed(2)}</p>
                          <p className="mb-0">Por humeada:</p>
                          <p className="mb-0 text-right">S/. {empleadoSeleccionado.totalHumeada.toFixed(2)}</p>
                          <p className="mb-0">Por tareas extras:</p>
                          <p className="mb-0 text-right">S/. {empleadoSeleccionado.totalTareasExtras.toFixed(2)}</p>
                          <p className="font-bold text-sm border-t pt-1 mt-1">TOTAL:</p>
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
