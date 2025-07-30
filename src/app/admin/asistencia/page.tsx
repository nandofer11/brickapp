"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Edit, Check, X, AlertCircle, Plus, Loader2, NotebookPen, Calendar1, Timer, Flame, Wind } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateForInput, getCurrentDateForLima } from "@/utils/dateFormat" // Importar ambas funciones

interface Personal {
  id_personal: number
  nombre_completo: string
  estado: number
}

interface Semana {
  id_semana_laboral: number;
  fecha_inicio: string
  fecha_fin: string
  estado: number
  id_empresa: number
  created_at: string
  updated_at: string
}

// Modifica la interfaz Asistencia para incluir id_asistencia
interface Asistencia {
  id_asistencia?: number
  id_personal: number
  fecha: string
  estado: "A" | "I" | "M" | "-"
}

// Nueva interfaz para Cocción
interface Coccion {
  id_coccion: number
  nombre: string
  estado: string // "Programado" | "En Proceso" | "Finalizado"
  horno_id_horno: number
  semana_laboral_id_semana_laboral?: number
  fecha_encendido: string
  horno: Horno
}

// Nueva interfaz para Horno
interface Horno {
  id_horno: number
  nombre: string
  cantidad_humeadores: number
  cantidad_quemadores: number
}

// Nueva interfaz para turnos registrados
interface CoccionTurno {
  id_coccion_personal: number
  coccion_id_coccion: number
  personal_id_personal?: number
  cargo_coccion_id_cargo_coccion: number
  fecha: string
  personal_externo?: string
  nombre_personal?: string
  cargo?: string
  nombre_coccion?: string
  nombre_horno?: string
}

// Nueva interfaz para Cargo Coccion
interface CargoCoccion {
  id_cargo_coccion: number
  nombre_cargo: string
  costo_cargo: number
  id_horno: number // Agregado para filtrar por horno
}

// Nueva interfaz para almacenar los turnos de la semana
interface TurnoInfo {
  id_coccion_personal: number
  personal_id_personal?: number
  fecha: string
  cargo_coccion: {
    nombre_cargo: string
  }
}

export default function AsistenciaPage() {
  const router = useRouter()

  const [personal, setPersonal] = useState<Personal[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [asistencia, setAsistencia] = useState<Asistencia[]>([])
  const [selectedSemana, setSelectedSemana] = useState<number | null>(null)
  const [selectedAsistencia, setSelectedAsistencia] = useState<{
    [key: number]: { estado: string; id_asistencia?: number }
  }>({})
  const [selectAll, setSelectAll] = useState<"A" | "I" | "M" | null>(null)
  const [selectedDate, setSelectedDate] = useState(getCurrentDateForLima())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)

  // Estados para el modal de registro de turno
  const [turnoModalOpen, setTurnoModalOpen] = useState(false)
  const [tipoPersonal, setTipoPersonal] = useState("interno") // "interno" o "externo"
  const [cocciones, setCocciones] = useState<Coccion[]>([])
  const [hornos, setHornos] = useState<Horno[]>([])
  const [cargos, setCargos] = useState<CargoCoccion[]>([])
  const [cargosFiltrados, setCargosFiltrados] = useState<CargoCoccion[]>([])
  const [selectedCoccion, setSelectedCoccion] = useState<number | null>(null)
  const [turnoDate, setTurnoDate] = useState(
    new Date().toLocaleDateString("es-PE", { timeZone: "America/Lima" }).split("/").reverse().join("-"),
  )
  const [selectedPersonalTurno, setSelectedPersonalTurno] = useState<number | null>(null)
  const [selectedCargo, setSelectedCargo] = useState<string>("")
  const [nombreExterno, setNombreExterno] = useState("")
  const [isSubmittingTurno, setIsSubmittingTurno] = useState(false)
  const [personalSeleccionado, setPersonalSeleccionado] = useState<Record<number, boolean>>({})
  const [turnosRegistrados, setTurnosRegistrados] = useState<CoccionTurno[]>([])
  const [cargandoTurnos, setCargandoTurnos] = useState(false)
  
  // Estado para el modal de confirmación de eliminación de turno
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [turnoToDelete, setTurnoToDelete] = useState<number | null>(null)
  const [deletingTurno, setDeletingTurno] = useState(false)

  // Nuevos estados para manejar la lógica de límites de humeadores/quemadores
  const [hornoActual, setHornoActual] = useState<Horno | null>(null)
  const [limitePuestos, setLimitePuestos] = useState<number>(0)
  const [puestosSeleccionados, setPuestosSeleccionados] = useState<number>(0)
  const [tipoCargo, setTipoCargo] = useState<'humeador' | 'quemador' | 'otro'>('otro')

  // Nuevo estado para almacenar los turnos de todos los trabajadores
  const [turnosSemana, setTurnosSemana] = useState<TurnoInfo[]>([])

  useEffect(() => {
    document.title = "Asistencia"
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchPersonal(),
      fetchSemanas(),
      fetchAsistencia(),
      fetchCocciones(),
      fetchHornos(),
      fetchCargos()
    ])
    setIsLoading(false)
  }

  const fetchPersonal = async () => {
    try {
      const response = await fetch("/api/personal")
      const data = await response.json()
      setPersonal(data.filter((p: Personal) => p.estado === 1))
    } catch (error) {
      console.error("Error al cargar personal:", error)
      toast.error("Error al cargar personal")
    }
  }

  const fetchSemanas = async () => {
    try {
      const response = await fetch("/api/semana_laboral")
      const data = await response.json()

      // Ordenar las semanas por fecha de inicio (más reciente primero)
      const semanasOrdenadas = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
        : [];

      // Obtener solo las últimas 4 semanas
      const ultimasCuatroSemanas = semanasOrdenadas.slice(0, 4);
      setSemanas(ultimasCuatroSemanas)

      const semanaAbierta = ultimasCuatroSemanas.find((s: Semana) => s.estado === 1)
      if (semanaAbierta) {
        setSelectedSemana(semanaAbierta.id_semana_laboral)
      }
    } catch (error) {
      console.error("Error al cargar semanas:", error)
      toast.error("Error al cargar semanas")
    }
  }

  const fetchAsistencia = async () => {
    try {
      const response = await fetch("/api/asistencia")
      const data = await response.json()
      setAsistencia(data)
    } catch (error) {
      console.error("Error al cargar asistencia:", error)
      toast.error("Error al cargar asistencia")
    }
  }

  // Nueva función para cargar hornos
  const fetchHornos = async () => {
    try {
      const response = await fetch("/api/horno")
      const data = await response.json()
      setHornos(data)
    } catch (error) {
      console.error("Error al cargar hornos:", error)
      toast.error("Error al cargar hornos")
    }
  }

  // Nueva función para cargar cocciones
  const fetchCocciones = async () => {
    try {
      const response = await fetch("/api/coccion")
      const data = await response.json()

      // Filtrar cocciones que NO están finalizadas
      const coccionesNoFinalizadas = Array.isArray(data) ? data.filter(c => c.estado !== "Finalizado") : [];
      setCocciones(coccionesNoFinalizadas)

      // No seleccionar automáticamente la primera cocción
      setSelectedCoccion(null)
    } catch (error) {
      console.error("Error al cargar cocciones:", error)
      toast.error("Error al cargar cocciones")
    }
  }

  // Nueva función para cargar cargos de cocción
  const fetchCargos = async () => {
    try {
      const response = await fetch("/api/cargo_coccion")
      const data = await response.json()
      setCargos(data)
    } catch (error) {
      console.error("Error al cargar cargos de cocción:", error)
      toast.error("Error al cargar cargos")
    }
  }

  // Nueva función para cargar turnos registrados
  const fetchTurnosRegistrados = async (idCoccion?: number) => {
    try {
      setCargandoTurnos(true);
      const coccionId = idCoccion || selectedCoccion;

      if (!coccionId) {
        setTurnosRegistrados([]);
        return;
      }

      // Recuperar todos los turnos para esta cocción sin filtrar por semana
      const response = await fetch(`/api/coccion_turno?id_coccion=${coccionId}`);
      if (!response.ok) {
        throw new Error("Error al cargar turnos");
      }

      const data = await response.json();

      // Ordenar turnos por fecha (más recientes primero)
      const turnosOrdenados = data.sort((a: CoccionTurno, b: CoccionTurno) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setTurnosRegistrados(turnosOrdenados);

      // Adicionalmente, recargar los turnos de la semana para actualizar la vista principal
      if (selectedSemana) {
        fetchTurnosSemana(selectedSemana);
      }

    } catch (error) {
      console.error("Error al cargar turnos:", error)
      toast.error("Error al cargar turnos registrados")
    } finally {
      setCargandoTurnos(false);
    }
  }

  // Nueva función para cargar todos los turnos cuando se selecciona una semana
  useEffect(() => {
    if (selectedSemana) {
      fetchTurnosSemana(selectedSemana);
    }
  }, [selectedSemana]);

  // Modificamos la función fetchTurnosSemana para incluir turnos de cocciones que están en proceso
  // aunque hayan comenzado en semanas anteriores
  const fetchTurnosSemana = async (idSemana: number) => {
    try {
      // Primero, obtener todas las cocciones en proceso o programadas
      // que podrían estar relacionadas con la semana actual
      const coccionesResponse = await fetch("/api/coccion?estado=En Proceso");
      if (!coccionesResponse.ok) {
        throw new Error("Error al cargar cocciones en proceso");
      }
      const coccionesEnProceso = await coccionesResponse.json();

      // Obtener los IDs de todas estas cocciones
      const idsCocciones = coccionesEnProceso.map((c: Coccion) => c.id_coccion);

      // Ahora, obtenemos los turnos tanto por semana como por cocciones en proceso
      const [turnosPorSemanaResponse, turnosPorCoccionResponse] = await Promise.all([
        fetch(`/api/coccion_turno?id_semana=${idSemana}`),
        // Si hay cocciones en proceso, consultamos también sus turnos
        idsCocciones.length > 0
          ? fetch(`/api/coccion_turno?ids_coccion=${idsCocciones.join(',')}`)
          : Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      ]);

      if (!turnosPorSemanaResponse.ok) {
        throw new Error("Error al cargar turnos de la semana");
      }

      // Obtener los turnos
      const turnosPorSemana = await turnosPorSemanaResponse.json();

      // Si hay cocciones en proceso, procesamos también sus turnos
      let turnosPorCoccion = [];
      if (idsCocciones.length > 0 && turnosPorCoccionResponse.ok) {
        turnosPorCoccion = await turnosPorCoccionResponse.json();
      }

      // Combinar ambos conjuntos de turnos, eliminando duplicados
      const todosLosTurnos = [...turnosPorSemana];

      // Añadir solo turnos de cocciones en proceso que no estén ya en los turnos por semana
      turnosPorCoccion.forEach((turno: TurnoInfo) => {
        const yaExiste = todosLosTurnos.some((t: TurnoInfo) =>
          t.id_coccion_personal === turno.id_coccion_personal
        );
        if (!yaExiste) {
          todosLosTurnos.push(turno);
        }
      });

      setTurnosSemana(todosLosTurnos);

    } catch (error) {
      console.error("Error cargando turnos de la semana:", error);
      toast.warning("No se pudieron cargar algunos turnos de cocciones en proceso");
    }
  };

  // Función para obtener los turnos de la semana seleccionada
  // const fetchTurnosSemana = async (idSemana: number) => {
  //   try {
  //     const response = await fetch(`/api/coccion_turno?id_semana=${idSemana}`);
  //     if (!response.ok) {
  //       throw new Error("Error al cargar turnos de la semana");
  //     }
  //     const data = await response.json();
  //     setTurnosSemana(data);
  //   } catch (error) {
  //     console.error("Error cargando turnos de la semana:", error);
  //   }
  // };

  // Función para verificar si un personal tiene turno en una fecha específica y obtener el tipo
  const getTurnoForPersonalAndDate = (idPersonal: number, fecha: string) => {
    // Normalizar la fecha para comparar solo año-mes-día
    const fechaNormalizada = new Date(fecha).toISOString().split('T')[0];

    // Buscar si existe un turno para este personal en esta fecha
    const turno = turnosSemana.find(t => {
      if (!t.personal_id_personal || t.personal_id_personal !== idPersonal) return false;

      // Normalizar la fecha del turno
      const fechaTurno = new Date(t.fecha).toISOString().split('T')[0];
      return fechaTurno === fechaNormalizada;
    });

    if (!turno) return null;

    // Identificar el tipo de cargo para devolver el tipo de icono
    const nombreCargo = turno.cargo_coccion?.nombre_cargo?.toLowerCase() || '';
    if (nombreCargo.includes('humeador')) {
      return 'humeador';
    } else if (nombreCargo.includes('quemador')) {
      return 'quemador';
    }
    return 'otro';
  };

  // Función para obtener el icono del turno según el tipo
  const getTurnoIcon = (tipo: string | null) => {
    if (tipo === 'humeador') {
      return <Wind className="h-4 w-4 text-blue-600 ml-1" />;
    } else if (tipo === 'quemador') {
      return <Flame className="h-4 w-4 text-orange-600 ml-1" />;
    }
    return null;
  };

  // Modificamos la API para obtener turnos por semana
  useEffect(() => {
    // Actualizar el endpoint de la API para que soporte consulta por id_semana
    const patchAPI = async () => {
      try {
        // Simulamos la modificación del endpoint - en producción esto ya debería estar implementado
        console.log("API de turnos por semana debería soportar filtrado por id_semana");
      } catch (error) {
        console.error("Error actualizando API:", error);
      }
    };

    patchAPI();
  }, []);

  const handleRegisterTurno = async () => {
    if (!selectedCoccion) {
      toast.error("Seleccione una cocción")
      return
    }

    if (!turnoDate) {
      toast.error("Seleccione una fecha para el turno")
      return
    }

    if (!selectedCargo) {
      toast.error("Seleccione un cargo")
      setIsSubmittingTurno(false)
      return
    }

    try {
      setIsSubmittingTurno(true)

      // Array para almacenar todos los turnos a registrar
      const turnosARegistrar = []

      // Preparar datos base para todos los registros
      const fechaTurnoISO = new Date(turnoDate).toISOString()

      if (tipoPersonal === "interno") {
        // Verificar si hay al menos un personal seleccionado
        const hayPersonalSeleccionado = Object.values(personalSeleccionado).some(valor => valor)

        if (!hayPersonalSeleccionado) {
          toast.error("Seleccione al menos un trabajador")
          setIsSubmittingTurno(false)
          return
        }

        // Verificar límite de selección para humeadores/quemadores
        if (limitePuestos > 0 && tipoCargo !== 'otro' && puestosSeleccionados < limitePuestos) {
          toast.warning(`Debe seleccionar ${limitePuestos} ${tipoCargo === 'humeador' ? 'humeador(es)' : 'quemador(es)'}`);
          setIsSubmittingTurno(false);
          return;
        }

        // Crear un turno para cada personal seleccionado
        Object.entries(personalSeleccionado).forEach(([idPersonal, seleccionado]) => {
          if (seleccionado) {
            turnosARegistrar.push({
              id_coccion: selectedCoccion,
              coccion_id_coccion: selectedCoccion,
              fecha: fechaTurnoISO,
              tipo_personal: "interno",
              id_personal: Number(idPersonal),
              personal_id_personal: Number(idPersonal),
              cargo_coccion_id: Number(selectedCargo),
              cargo_coccion_id_cargo_coccion: Number(selectedCargo)
            })
          }
        })
      } else {
        // Personal externo
        if (!nombreExterno.trim()) {
          toast.error("Ingrese el nombre del personal externo")
          setIsSubmittingTurno(false)
          return
        }

        turnosARegistrar.push({
          id_coccion: selectedCoccion,
          coccion_id_coccion: selectedCoccion,
          fecha: fechaTurnoISO,
          tipo_personal: "externo",
          personal_externo: nombreExterno,
          cargo_coccion_id: Number(selectedCargo),
          cargo_coccion_id_cargo_coccion: Number(selectedCargo)
        })
      }

      // Enviar todos los turnos a registrar
      const response = await fetch("/api/coccion_turno", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(turnosARegistrar),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el turno");
      }

      toast.success(`${turnosARegistrar.length > 1 ? 'Turnos registrados' : 'Turno registrado'} correctamente`)

      // Limpiar campos y actualizar la lista de turnos
      resetSeleccionPersonal()
      fetchTurnosRegistrados()

      // Importante: Actualizar también los turnos de la semana para la vista principal
      if (selectedSemana) {
        fetchTurnosSemana(selectedSemana);
      }

      if (tipoPersonal === "externo") {
        setNombreExterno("")
      }

    } catch (error) {
      console.error("Error:", error)
      toast.error(`Hubo un error al registrar el turno: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSubmittingTurno(false)
    }
  }

  // Función para manejar el cambio de cargo seleccionado
  const handleCargoChange = (value: string) => {
    setSelectedCargo(value);
    resetSeleccionPersonal();

    if (!hornoActual || !value) {
      setLimitePuestos(0);
      setTipoCargo('otro');
      return;
    }

    // Determinar el tipo de cargo y establecer límite correspondiente
    const cargoNombre = cargos.find(c => c.id_cargo_coccion.toString() === value)?.nombre_cargo.toLowerCase() || "";

    if (cargoNombre.includes('humeador')) {
      setTipoCargo('humeador');
      setLimitePuestos(hornoActual.cantidad_humeadores || 0);
    } else if (cargoNombre.includes('quemador')) {
      setTipoCargo('quemador');
      setLimitePuestos(hornoActual.cantidad_quemadores || 0);
    } else {
      setTipoCargo('otro');
      setLimitePuestos(0); // Sin límite para otros cargos
    }

    setPuestosSeleccionados(0)
  }

  // Función para manejar la selección de personal con el límite de puestos
  const handlePersonalSelection = (idPersonal: number, checked: boolean) => {
    // Si está deseleccionando, siempre permitir
    if (!checked) {
      setPersonalSeleccionado(prev => ({ ...prev, [idPersonal]: false }));
      if (personalSeleccionado[idPersonal]) {
        setPuestosSeleccionados(prev => prev - 1);
      }
      return;
    }

    // Si está seleccionando
    const nuevaCantidad = puestosSeleccionados + 1;

    // Verificar si alcanzó el límite
    if (limitePuestos > 0 && nuevaCantidad > limitePuestos) {
      toast.warning(`Solo puede seleccionar ${limitePuestos} ${tipoCargo === 'humeador' ? 'humeadores' : 'quemadores'}`);
      return;
    }

    setPersonalSeleccionado(prev => ({ ...prev, [idPersonal]: true }));
    setPuestosSeleccionados(nuevaCantidad);
  }

  // Modificar la función resetSeleccionPersonal
  const resetSeleccionPersonal = () => {
    setPersonalSeleccionado({});
    setSelectedPersonalTurno(null);
    setPuestosSeleccionados(0);
  }

  // Función para resetear el modal de turno
  const resetTurnoModal = () => {
    setTipoPersonal("interno")
    setSelectedPersonalTurno(null)

    // función utilitaria que maneja específicamente la zona horaria de Lima
    setTurnoDate(getCurrentDateForLima())

    setSelectedCargo("")
    setNombreExterno("")
    resetSeleccionPersonal()
    setCargosFiltrados([])
    setHornoActual(null)
    setLimitePuestos(0)
    setTipoCargo('otro')

    // No seleccionar automáticamente la primera cocción
    setSelectedCoccion(null)
  }

  // Función para obtener el nombre del cargo
  const getNombreCargo = (id_cargo: number | string) => {
    if (!id_cargo) return 'Sin cargo';
    const cargo = cargos.find(c => c.id_cargo_coccion === Number(id_cargo));
    return cargo ? cargo.nombre_cargo : 'Sin cargo';
  }

  // Función para obtener el nombre del horno
  const getNombreHorno = (id_horno: number) => {
    return hornos.find(h => h.id_horno === id_horno)?.nombre || 'Desconocido'
  }

  // Función para obtener la semana
  const getSemanaInfo = (id_semana_laboral?: number) => {
    if (!id_semana_laboral) return ''
    const semana = semanas.find(s => s.id_semana_laboral === id_semana_laboral)
    if (!semana) return ''
    return `S: ${formatDate(semana.fecha_inicio, false)} al ${formatDate(semana.fecha_fin, false)}`
  }
  
  // Función para eliminar un turno
  const handleDeleteTurno = async () => {
    if (!turnoToDelete) return;
    
    try {
      setDeletingTurno(true);
      
      const response = await fetch(`/api/coccion_turno?id=${turnoToDelete}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el turno");
      }
      
      toast.success("Turno eliminado correctamente");
      
      // Actualizar la lista de turnos
      fetchTurnosRegistrados();
      
      // Actualizar también los turnos de la semana para la vista principal
      if (selectedSemana) {
        fetchTurnosSemana(selectedSemana);
      }
      
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      toast.error(`Error al eliminar turno: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDeletingTurno(false);
      setDeleteModalOpen(false);
      setTurnoToDelete(null);
    }
  }
  
  // Función para mostrar el modal de confirmación de eliminación
  const confirmDeleteTurno = (idTurno: number) => {
    setTurnoToDelete(idTurno);
    setDeleteModalOpen(true);
  }

  // Filtrar cargos según el horno seleccionado
  const filtrarCargosPorHorno = (idHorno: number) => {
    const filtrados = cargos.filter(cargo => cargo.id_horno === idHorno);
    setCargosFiltrados(filtrados);

    // Si el cargo actual no está en los filtrados, limpiarlo
    if (selectedCargo && !filtrados.some(c => c.id_cargo_coccion.toString() === selectedCargo)) {
      setSelectedCargo("");
    }
  };

  // Función que se ejecuta al cambiar la cocción seleccionada
  const handleCoccionChange = (value: string) => {
    if (!value) {
      setSelectedCoccion(null);
      setCargosFiltrados([]);
      setHornoActual(null);
      resetSeleccionPersonal();
      return;
    }

    const coccionId = Number(value)
    setSelectedCoccion(coccionId)
    fetchTurnosRegistrados(coccionId)

    // Obtener el id_horno de la cocción seleccionada
    const coccionSeleccionada = cocciones.find(c => c.id_coccion === coccionId);
    if (coccionSeleccionada) {
      // Filtrar los cargos por el horno de la cocción
      filtrarCargosPorHorno(coccionSeleccionada.horno_id_horno);

      // Obtener información del horno
      const hornoInfo = hornos.find(h => h.id_horno === coccionSeleccionada.horno_id_horno);
      if (hornoInfo) {
        setHornoActual(hornoInfo);
      } else {
        setHornoActual(null);
      }

      // Reiniciar selección de cargos y personal cuando cambia la cocción
      setSelectedCargo("");
      resetSeleccionPersonal();
      setLimitePuestos(0);
      setPuestosSeleccionados(0);
    }
  }

  const formatDate = (dateString: string, includeYear = true) => {
    try {
      if (!dateString) return '';

      // Convertir la fecha UTC a fecha local de Lima (UTC-5)
      const date = new Date(dateString);
      date.setHours(date.getHours() + 5); // Ajustar a UTC-5 (Lima)

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return includeYear ? `${day}-${month}-${year}` : `${day}-${month}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  }

  const getDaysOfWeek = (start: string, end: string) => {
    try {
      // Convertir fechas UTC a fechas locales de Lima
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Ajustar a UTC-5 (Lima)
      startDate.setHours(startDate.getHours() + 5);
      endDate.setHours(endDate.getHours() + 5);

      const days: string[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const day = currentDate.getDate().toString().padStart(2, "0");
        days.push(`${year}-${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return days;
    } catch (error) {
      console.error('Error al obtener nombre del día:', error);
      return 'Error';
    }
  }

  const selectedWeek = semanas.find((s) => s.id_semana_laboral === selectedSemana)
  const daysOfWeek = selectedWeek ? getDaysOfWeek(selectedWeek.fecha_inicio, selectedWeek.fecha_fin) : []

  // Modificamos la función handleEditAsistencia
   const handleEditAsistencia = async (fecha: string) => {
    try {
      if (!selectedSemana) {
        toast.error("Por favor, seleccione una semana")
        return
      }

      // Asegurar que la fecha esté en formato YYYY-MM-DD
      const fechaObj = new Date(fecha)
      const fechaFormateada = fechaObj.toISOString().split('T')[0]

      setSelectedDate(fechaFormateada)
      setModoEdicion(true)
      setModalOpen(true)

      // Agregar los parámetros de consulta necesarios
      const queryParams = new URLSearchParams({
        fecha: fechaFormateada,
        id_semana_laboral: selectedSemana.toString()
      })

      const response = await fetch(`/api/asistencia?${queryParams.toString()}`)

      if (!response.ok) throw new Error("Error al obtener asistencia")

      const asistenciaData = await response.json()
      
      console.log("Datos de asistencia recuperados:", asistenciaData);

      // Inicializar todas las asistencias como vacías
      const asistenciaSeleccionada: Record<number, { estado: "A" | "I" | "M" | "-"; id_asistencia?: number }> = {}

      // Primero inicializar todos los trabajadores con estado "-"
      personal.forEach(p => {
        asistenciaSeleccionada[p.id_personal] = {
          estado: "-",
          id_asistencia: undefined
        }
      })

      // Luego actualizar solo los que tienen asistencia registrada para esta fecha específica
      // y para esta semana específica
      if (Array.isArray(asistenciaData)) {
        asistenciaData.forEach((a: any) => {
          // Verificar que la asistencia corresponda a la semana seleccionada
          if (a.id_personal && a.id_semana_laboral === selectedSemana) {
            // Verificar que la fecha coincida (omitir la parte de la hora)
            const fechaAsistencia = new Date(a.fecha).toISOString().split('T')[0];
            if (fechaAsistencia === fechaFormateada) {
              asistenciaSeleccionada[a.id_personal] = {
                estado: a.estado as "A" | "I" | "M",
                id_asistencia: a.id_asistencia
              }
            }
          }
        })
      }

      console.log("Estado de asistencia procesado:", asistenciaSeleccionada);
      
      setSelectedAsistencia(asistenciaSeleccionada)
    } catch (error) {
      console.error("Error cargando asistencia:", error)
      toast.error("Error al cargar la asistencia")
    }
  }
  // Actualiza la función handleRegisterAsistencia para incluir id_asistencia en modo edición
  const handleRegisterAsistencia = async () => {
    if (!selectedSemana) {
      toast.error("Por favor, seleccione una semana")
      return
    }

    const semanaActual = semanas.find(s => s.id_semana_laboral === selectedSemana)
    if (!semanaActual) {
      toast.error("No se encontró información de la semana seleccionada")
      return
    }

    // Validar que la fecha esté dentro del rango de la semana
    if (!isDateInRange(selectedDate, semanaActual.fecha_inicio, semanaActual.fecha_fin)) {
      toast.error(`La fecha debe estar dentro del rango de la semana seleccionada (${formatDate(semanaActual.fecha_inicio)} al ${formatDate(semanaActual.fecha_fin)})`)
      return
    }

    // verificar que todos los trabajadores tengan un estado seleccionado
    const personalSinEstado = personal.filter(p =>
      !selectedAsistencia[p.id_personal] ||
      !selectedAsistencia[p.id_personal].estado ||
      selectedAsistencia[p.id_personal].estado === "-"
    );

    if (personalSinEstado.length > 0) {
      // Mostrar mensaje de error con el número de trabajadores sin estado
      toast.error(`Hay ${personalSinEstado.length} trabajador(es) sin estado de asistencia seleccionado`);
      return;
    }
    try {
      // Si no estamos en modo edición, verificamos que no existan registros previos para la fecha
      if (!modoEdicion) {
        // Consultamos si ya hay asistencias registradas para esta fecha y semana
        const queryParams = new URLSearchParams({
          fecha: selectedDate,
          id_semana_laboral: selectedSemana.toString()
        });

        const verificacionResponse = await fetch(`/api/asistencia?${queryParams.toString()}`);

        if (!verificacionResponse.ok) {
          throw new Error("Error al verificar asistencias existentes");
        }

        const asistenciasExistentes = await verificacionResponse.json();

        // Normalizar la fecha seleccionada para comparación (solo año-mes-día)
        const fechaSeleccionadaNormalizada = new Date(selectedDate);
        fechaSeleccionadaNormalizada.setHours(0, 0, 0, 0);

        // Verificar específicamente que las asistencias existentes correspondan a la semana seleccionada 
        // Y a la misma fecha (ignorando la hora)
        const asistenciasEnEstaSemanaYFecha = asistenciasExistentes.filter((a: any) => {
          // Verificar semana
          if (a.id_semana_laboral !== selectedSemana) return false;

          // Normalizar la fecha de asistencia existente (solo año-mes-día)
          const fechaAsistencia = new Date(a.fecha);
          fechaAsistencia.setHours(0, 0, 0, 0);

          // Comparar fechas normalizadas
          return (
            fechaAsistencia.getFullYear() === fechaSeleccionadaNormalizada.getFullYear() &&
            fechaAsistencia.getMonth() === fechaSeleccionadaNormalizada.getMonth() &&
            fechaAsistencia.getDate() === fechaSeleccionadaNormalizada.getDate()
          );
        });

        // Si hay al menos un registro de asistencia para esta fecha Y en esta semana específica, mostramos error
        if (asistenciasEnEstaSemanaYFecha && asistenciasEnEstaSemanaYFecha.length > 0) {
          toast.error("Ya existe registro de asistencia para la fecha seleccionada en esta semana. Para modificarla, utilice la opción de edición desde la tabla.");
          return;
        }
      }

      const fechaAsistenciaISO = new Date(selectedDate ?? new Date()).toISOString();

      // Construye los datos de asistencia según el modo (edición o creación)
      const asistenciaData = Object.entries(selectedAsistencia)
        .filter(([_, datos]) => datos.estado !== "-") // Filtra elementos con estado "-"
        .map(([id_personal, datos]) => {
          const baseData = {
            id_personal: Number(id_personal),
            id_semana_laboral: selectedSemana,
            fecha: fechaAsistenciaISO,
            estado: datos.estado,
          };

          // Si estamos en modo edición y tenemos un id_asistencia, lo incluimos
          if (modoEdicion && datos.id_asistencia) {
            return {
              ...baseData,
              id_asistencia: datos.id_asistencia,
            };
          }

          return baseData;
        });

      if (asistenciaData.length === 0) {
        toast.error("Seleccione al menos un trabajador con un estado de asistencia válido");
        return;
      }

      setIsSubmitting(true);
      const response = await fetch("/api/asistencia", {
        method: modoEdicion ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(asistenciaData),
      });

      if (!response.ok) {
        throw new Error(modoEdicion ? "Error al actualizar la asistencia" : "Error al registrar la asistencia");
      }

      toast.success(modoEdicion ? "Asistencia actualizada correctamente" : "Asistencia guardada correctamente");
      fetchAsistencia();
      setModalOpen(false);
      resetModal();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Hubo un error al procesar la asistencia");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Actualiza la función handleMarkAll para el nuevo formato de selectedAsistencia
  const handleMarkAll = (estado: "A" | "I" | "M") => {
    setSelectAll(estado)

    // Mantener los id_asistencia existentes al marcar todos
    const newState: Record<number, { estado: "A" | "I" | "M"; id_asistencia?: number }> = {}
    personal.forEach((p) => {
      const existingData = selectedAsistencia[p.id_personal] || { estado: "", id_asistencia: undefined }
      newState[p.id_personal] = {
        estado: estado,
        id_asistencia: existingData.id_asistencia,
      }
    })

    setSelectedAsistencia(newState)
  }

  // Actualiza resetModal para el nuevo formato
  const resetModal = () => {
    setSelectedDate(getCurrentDateForLima())
    setSelectedAsistencia({})
    setModoEdicion(false)
    setSelectAll(null)
  }

  const handleOpenRegisterModal = () => {
    resetModal()
    setSelectedDate(getCurrentDateForLima())
    setModalOpen(true)
  }

  // Modificamos el handler para abrir el modal de turno
  const handleOpenTurnoModal = () => {
    resetTurnoModal();
    setTurnoModalOpen(true);

    // Recargar cocciones para asegurarnos de tener la lista actualizada
    fetchCocciones();
    fetchTurnosRegistrados();
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    resetModal()
  }

  const getAsistenciaIcon = (estado: string) => {
    switch (estado) {
      case "A":
        return <Check className="h-5 w-5 text-green-600" />
      case "I":
        return <X className="h-5 w-5 text-red-600" />
      case "M":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <span className="text-gray-300">-</span>
    }
  }

  const getDayName = (date: string) => {
    try {
      const dateObj = new Date(date);
      dateObj.setHours(dateObj.getHours() + 5); // Ajustar a UTC-5 (Lima)
      const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      return dayNames[dateObj.getDay()];
    } catch (error) {
      console.error('Error al obtener nombre del día:', error);
      return 'Error';
    }
  }

  const getAsistenciaForDate = (id_personal: number, fecha: string) => {
    // Convertir la fecha de la asistencia a formato YYYY-MM-DD para comparar
    return asistencia.find((a) => {
      const asistenciaDate = new Date(a.fecha);
      const compareDate = new Date(fecha);

      return (
        a.id_personal === id_personal &&
        asistenciaDate.getUTCFullYear() === compareDate.getUTCFullYear() &&
        asistenciaDate.getUTCMonth() === compareDate.getUTCMonth() &&
        asistenciaDate.getUTCDate() === compareDate.getUTCDate()
      );
    })?.estado || "-";
  }

  // Agregar esta función después de las interfaces y antes del componente principal
  const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
    const selectedDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Resetear las horas para comparar solo fechas
    selectedDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return selectedDate >= start && selectedDate <= end;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold mb-2">Asistencia del Personal</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <Label htmlFor="semana-select" className="mb-2 block">
            Seleccionar Semana:
          </Label>
          <div className="flex items-center gap-2">
            <Calendar1 />
            <Select value={selectedSemana?.toString() || ""} onValueChange={(value) => setSelectedSemana(Number(value))}>
              <SelectTrigger className="w-full md:w-[300px]" id="semana-select">
                <SelectValue placeholder="Seleccione una semana" />
              </SelectTrigger>
              <SelectContent>
                {semanas
                  .filter(semana => semana?.id_semana_laboral)
                  .map((semana) => (
                    <SelectItem
                      key={semana.id_semana_laboral}
                      value={String(semana.id_semana_laboral)}
                    >
                      Semana del {formatDate(semana.fecha_inicio)} al {formatDate(semana.fecha_fin)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleOpenRegisterModal} className="w-full md:w-auto">
            <NotebookPen className="mr-2 h-4 w-4" /> Asistencia Semanal
          </Button>

          {/* Nuevo botón para registrar turno */}
          <Button onClick={handleOpenTurnoModal} variant="secondary" className="w-full md:w-auto">
            <Timer className="mr-2 h-4 w-4" /> Turno Cocción
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      ) : (
        <>
          <div className="flex">
            <Card className="p-1 px-0">
              <CardContent className="flex flex-wrap gap-2 p-2">
                <div className="flex items-center">
                  <Check className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs">Asistencia</span>
                </div>
                <div className="flex items-center">
                  <X className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-xs">Faltas</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="h-3 w-3 text-yellow-600 mr-1" />
                  <span className="text-xs">Medio Día</span>
                </div>
                <div className="flex items-center">
                  <Wind className="h-3 w-3 text-blue-600 mr-1" />
                  <span className="text-xs">Humeador</span>
                </div>
                <div className="flex items-center">
                  <Flame className="h-3 w-3 text-orange-600 mr-1" />
                  <span className="text-xs">Quemador</span>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Tabla de Asistencia */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={daysOfWeek.length + 4} className="text-center bg-muted">
                    {selectedWeek
                      ? `Semana del ${formatDate(selectedWeek.fecha_inicio)} al ${formatDate(selectedWeek.fecha_fin)}`
                      : "Seleccione una semana"}
                  </TableHead>
                </TableRow>

                <TableRow>
                  <TableHead className="bg-muted/50">Empleado</TableHead>

                  {Array.isArray(daysOfWeek) && daysOfWeek.map((dia) => {
                    // Verificar si hay asistencias registradas para este día
                    const hayAsistenciasParaEsteDia = asistencia.some((a) => {
                      const asistenciaDate = new Date(a.fecha);
                      const compareDate = new Date(dia);

                      return (
                        asistenciaDate.getUTCFullYear() === compareDate.getUTCFullYear() &&
                        asistenciaDate.getUTCMonth() === compareDate.getUTCMonth() &&
                        asistenciaDate.getUTCDate() === compareDate.getUTCDate()
                      );
                    });

                    return (
                      <TableHead key={dia} className="bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-xs text-muted-foreground">{getDayName(dia)}</span>
                            <span>{formatDate(dia, true)}</span>
                          </div>
                          {/* Mostrar el botón de editar solo si hay asistencias registradas */}
                          {hayAsistenciasParaEsteDia && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditAsistencia(dia)}
                              className="my-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}

                  <TableHead className="bg-muted/70 text-center">
                    <Check className="h-4 w-4 mx-auto text-green-600" />
                  </TableHead>
                  <TableHead className="bg-muted/70 text-center">
                    <X className="h-4 w-4 mx-auto text-red-600" />
                  </TableHead>
                  <TableHead className="bg-muted/70 text-center">
                    <AlertCircle className="h-4 w-4 mx-auto text-yellow-600" />
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {personal.map((p) => {
                  let totalAsistencias = 0;
                  let totalFaltas = 0;
                  let totalMediosDias = 0;

                  const asistenciaCeldas = Array.isArray(daysOfWeek) ? daysOfWeek.map((dia) => {
                    const estado = getAsistenciaForDate(p.id_personal, dia);
                    const tipoTurno = getTurnoForPersonalAndDate(p.id_personal, dia);
                    const turnoIcon = getTurnoIcon(tipoTurno);

                    // Acumular totales
                    if (estado === "A") totalAsistencias++;
                    if (estado === "I") totalFaltas++;
                    if (estado === "M") totalMediosDias++;

                    return (
                      <TableCell key={dia} className="text-center">
                        <div className="flex items-center justify-center">
                          {getAsistenciaIcon(estado)}
                          {turnoIcon}
                        </div>
                      </TableCell>
                    );
                  }) : [];

                  return (
                    <TableRow key={p.id_personal}>
                      <TableCell className="font-medium">{p.nombre_completo}</TableCell>
                      {asistenciaCeldas}
                      <TableCell className="text-center font-bold bg-green-200">
                        {totalAsistencias}
                      </TableCell>
                      <TableCell className="text-center font-bold">{totalFaltas}</TableCell>
                      <TableCell className="text-center font-bold">{totalMediosDias}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Modal de Registro de Asistencia */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95%] p-2 sm:p-6 max-h-[90vh]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-xl">
              {modoEdicion ? "Actualizar Asistencia" : "Registro de Asistencia"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {modoEdicion
                ? "Modifique los estados de asistencia para la fecha seleccionada"
                : "Seleccione la semana, fecha y registre la asistencia del personal"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-1 gap-3">
              {/* Selector de Semana */}
              <div className="space-y-1.5">
                <Label htmlFor="semana-modal" className="text-sm">Seleccionar Semana:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedSemana?.toString() || ""}
                    onValueChange={(value) => setSelectedSemana(Number(value))}
                    disabled
                  >
                    <SelectTrigger id="semana-modal" className="w-full text-sm">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {semanas
                        .filter(semana => semana?.id_semana_laboral && semana.estado === 1)
                        .map((semana) => (
                          <SelectItem
                            key={semana.id_semana_laboral}
                            value={String(semana.id_semana_laboral)}
                            className="text-sm"
                          >
                            {formatDate(semana.fecha_inicio)} al {formatDate(semana.fecha_fin)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" onClick={() => router.push("/admin/dashboard")} disabled={modoEdicion} className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Selector de Fecha */}
              <div className="space-y-1.5">
                <Label htmlFor="fecha" className="text-sm">Seleccionar Fecha:</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split("T")[0]}
                  disabled={modoEdicion}
                  className="w-full text-sm"
                />
              </div>
            </div>

            {/* Radio Buttons para marcar todos */}
            <div className="space-y-1.5">
              <Label className="text-sm">Marcar para todos:</Label>
              <RadioGroup
                value={selectAll || ""}
                onValueChange={(value) => handleMarkAll(value as "A" | "I" | "M")}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="markAllA" />
                  <Label htmlFor="markAllA" className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-1" /> Asistencia
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="I" id="markAllI" />
                  <Label htmlFor="markAllI" className="flex items-center">
                    <X className="h-4 w-4 text-red-600 mr-1" /> Inasistencia
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="M" id="markAllM" />
                  <Label htmlFor="markAllM" className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-1" /> Medio Día
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Tabla de Personal */}
            <div className="border rounded-md ">
              <ScrollArea className="h-[35vh] w-[calc(100vw-4rem)] sm:w-full">
                <div className="min-w-[280px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted/50 w-[40%] text-sm">Empleado</TableHead>
                        <TableHead className="bg-muted/50 w-[20%] text-center">
                          <Check className="h-4 w-4 mx-auto text-green-600" />
                        </TableHead>
                        <TableHead className="bg-muted/50 w-[20%] text-center">
                          <X className="h-4 w-4 mx-auto text-red-600" />
                        </TableHead>
                        <TableHead className="bg-muted/50 w-[20%] text-center">
                          <AlertCircle className="h-4 w-4 mx-auto text-yellow-600" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personal.map((p) => (
                        <TableRow key={p.id_personal}>
                          <TableCell className="break-words text-sm py-2">{p.nombre_completo}</TableCell>
                          <TableCell className="text-center">
                            <RadioGroup
                              value={selectedAsistencia[p.id_personal]?.estado || ""}
                              onValueChange={(value) =>
                                setSelectedAsistencia({
                                  ...selectedAsistencia,
                                  [p.id_personal]: {
                                    ...selectedAsistencia[p.id_personal],
                                    estado: value as "A" | "I" | "M",
                                  },
                                })
                              }
                              className="flex justify-center"
                            >
                              <RadioGroupItem value="A" id={`A-${p.id_personal}`} className="cursor-pointer" />
                            </RadioGroup>
                          </TableCell>
                          <TableCell className="text-center">
                            <RadioGroup
                              value={selectedAsistencia[p.id_personal]?.estado || ""}
                              onValueChange={(value) =>
                                setSelectedAsistencia({
                                  ...selectedAsistencia,
                                  [p.id_personal]: {
                                    ...selectedAsistencia[p.id_personal],
                                    estado: value as "A" | "I" | "M",
                                  },
                                })
                              }
                              className="flex justify-center"
                            >
                              <RadioGroupItem value="I" id={`I-${p.id_personal}`} className="cursor-pointer" />
                            </RadioGroup>
                          </TableCell>
                          <TableCell className="text-center">
                            <RadioGroup
                              value={selectedAsistencia[p.id_personal]?.estado || ""}
                              onValueChange={(value) =>
                                setSelectedAsistencia({
                                  ...selectedAsistencia,
                                  [p.id_personal]: {
                                    ...selectedAsistencia[p.id_personal],
                                    estado: value as "A" | "I" | "M",
                                  },
                                })
                              }
                              className="flex justify-center"
                            >
                              <RadioGroupItem value="M" id={`M-${p.id_personal}`} className="cursor-pointer" />
                            </RadioGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting} className="w-full sm:w-auto text-sm">
              Cerrar
            </Button>
            <Button onClick={handleRegisterAsistencia} disabled={isSubmitting} className="w-full sm:w-auto text-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modoEdicion ? "Actualizando..." : "Guardando..."}
                </>
              ) : modoEdicion ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Registro de Turno */}
      <Dialog open={turnoModalOpen} onOpenChange={setTurnoModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[900px] p-3 sm:p-4 h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-xl">
              Registro de Turno
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Seleccione la cocción, fecha y personal para el turno
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-90px)] overflow-hidden">
            {/* Columna del formulario */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {/* Selector de Cocción */}
              <div className="space-y-1">
                <Label htmlFor="coccion-modal" className="text-xs sm:text-sm">Cocción:</Label>
                <Select
                  value={selectedCoccion?.toString() || ""}
                  onValueChange={handleCoccionChange}
                >
                  <SelectTrigger id="coccion-modal" className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Seleccionar cocción disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {cocciones.length > 0 ? (
                      cocciones.map((coccion) => {
                        const hornoNombre = coccion.horno?.nombre || getNombreHorno(coccion.horno_id_horno);
                        const coccionId = coccion.id_coccion;
                        const semanaId = coccion.semana_laboral_id_semana_laboral;

                        // Verificar si es una cocción de una semana anterior
                        const esCoccionDeSemanaAnterior = semanaId !== selectedSemana;

                        return (
                          <SelectItem
                            key={coccion.id_coccion}
                            value={String(coccion.id_coccion)}
                            className="text-xs sm:text-sm"
                          >
                            Id: {coccionId} - Horno: {hornoNombre} - {coccion.estado}
                            {esCoccionDeSemanaAnterior && " 🔄 (Continúa)"}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem disabled value="no-data" className="text-xs sm:text-sm">
                        No hay cocciones disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Mostrar información del horno seleccionado y aviso si es cocción de otra semana */}
                {selectedCoccion && (() => {
                  const coccionSeleccionada = cocciones.find(c => c.id_coccion === selectedCoccion);
                  const esCoccionDeSemanaAnterior = coccionSeleccionada &&
                    coccionSeleccionada.semana_laboral_id_semana_laboral !== selectedSemana;

                  return (
                    <div className="mt-1">
                      {hornoActual && (
                        <div className="text-xs text-muted-foreground">
                          Horno: {hornoActual.nombre} - Humeadores: {hornoActual.cantidad_humeadores || 0},
                          Quemadores: {hornoActual.cantidad_quemadores || 0}
                        </div>
                      )}

                      {esCoccionDeSemanaAnterior && (
                        <div className="text-xs text-amber-600 font-medium mt-1">
                          ⚠️ Esta cocción comenzó en una semana anterior pero continúa en proceso.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Selector de Tipo de Personal */}
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Tipo de Personal:</Label>
                <RadioGroup
                  value={tipoPersonal}
                  onValueChange={(value) => {
                    setTipoPersonal(value)
                    resetSeleccionPersonal()
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="interno" id="interno" />
                    <Label htmlFor="interno" className="text-xs sm:text-sm">Personal Interno</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="externo" id="externo" />
                    <Label htmlFor="externo" className="text-xs sm:text-sm">Personal Externo</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Selector de Fecha */}
              <div className="space-y-1">
                <Label htmlFor="fecha-turno" className="text-xs sm:text-sm">Fecha del Turno:</Label>
                <Input
                  id="fecha-turno"
                  type="date"
                  value={turnoDate}
                  onChange={(e) => setTurnoDate(e.target.value)}
                  className="w-full text-xs sm:text-sm"
                />
              </div>

              {/* Selección de cargo para ambos tipos de personal (interno y externo) */}
              <div className="space-y-1">
                <Label htmlFor="cargo-turno" className="text-xs sm:text-sm">Cargo:</Label>
                <Select
                  value={selectedCargo}
                  onValueChange={handleCargoChange}
                >
                  <SelectTrigger id="cargo-turno" className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Seleccione un cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargosFiltrados.length > 0 ? (
                      cargosFiltrados.map((cargo) => (
                        <SelectItem
                          key={cargo.id_cargo_coccion}
                          value={cargo.id_cargo_coccion.toString()}
                          className="text-xs sm:text-sm"
                        >
                          {cargo.nombre_cargo} - S/ {Number(cargo.costo_cargo).toFixed(2)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="no-cargo" className="text-xs sm:text-sm">
                        {!selectedCoccion
                          ? "Primero seleccione una cocción"
                          : "No hay cargos disponibles para este horno"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Mostrar información de límite de selección */}
                {limitePuestos > 0 && (
                  <div className="mt-1 text-xs text-primary">
                    Debe seleccionar {puestosSeleccionados}/{limitePuestos} {tipoCargo === 'humeador' ? 'humeador(es)' : 'quemador(es)'
                    }
                  </div>
                )}
              </div>

              {/* Campos según tipo de personal */}
              {tipoPersonal === "interno" ? (
                // Lista de Personal con checkboxes
                <div className="space-y-1 border rounded-md p-2">
                  <Label className="text-xs sm:text-sm mb-2 block">
                    Seleccionar Personal:
                    {limitePuestos > 0 && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        (Seleccione exactamente {limitePuestos} {tipoCargo === 'humeador' ? 'humeador(es)' : 'quemador(es)'})
                      </span>
                    )}
                  </Label>

                  <div className="max-h-[150px] overflow-y-auto pr-1">
                    {personal.length === 0 ? (
                      <div className="text-xs sm:text-sm text-center text-gray-500 py-4">
                        No hay personal registrado
                      </div>
                    ) : (
                      personal.map((p) => (
                        <div key={p.id_personal} className="flex items-center space-x-2 py-1 px-1">
                          <input
                            type="checkbox"
                            id={`personal-check-${p.id_personal}`}
                            checked={!!personalSeleccionado[p.id_personal]}
                            onChange={(e) => {
                              handlePersonalSelection(p.id_personal, e.target.checked);
                            }}
                            disabled={
                              !selectedCargo || // Deshabilitar si no hay cargo seleccionado
                              (limitePuestos > 0 && // Si hay un límite
                                puestosSeleccionados >= limitePuestos && // Si ya alcanzó el límite
                                !personalSeleccionado[p.id_personal]) // Y este checkbox no estaba seleccionado
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label
                            htmlFor={`personal-check-${p.id_personal}`}
                            className={`text-xs sm:text-sm cursor-pointer ${!selectedCargo ||
                              (limitePuestos > 0 &&
                                puestosSeleccionados >= limitePuestos &&
                                !personalSeleccionado[p.id_personal]) ?
                              'text-gray-400' : ''
                              }`}
                          >
                            {p.nombre_completo}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Campo para personal externo */
                <div className="space-y-1">
                  <Label htmlFor="nombre-externo" className="text-xs sm:text-sm">Nombre del Personal Externo:</Label>
                  <Input
                    id="nombre-externo"
                    value={nombreExterno}
                    onChange={(e) => setNombreExterno(e.target.value)}
                    placeholder="Ingrese el nombre completo"
                    className="w-full text-xs sm:text-sm"
                  />
                </div>
              )}

              <div className="mt-4 flex-shrink-0">
                <Button
                  onClick={handleRegisterTurno}
                  disabled={isSubmittingTurno ||
                    !selectedCoccion ||
                    !selectedCargo ||
                    (limitePuestos > 0 && puestosSeleccionados !== limitePuestos && tipoPersonal === "interno")}
                  className="w-full text-xs sm:text-sm"
                >
                  {isSubmittingTurno ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>

            {/* Columna de la tabla de turnos registrados */}
            <div className="flex flex-col gap-3 overflow-hidden h-full">
              <div className="text-xs sm:text-sm font-medium">
                Turnos registrados:
              </div>
              <div className="border rounded-md flex-grow overflow-hidden">
                {cargandoTurnos ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-xs sm:text-sm">Cargando turnos...</span>
                  </div>
                ) : !selectedCoccion ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                    Seleccione una cocción para ver los turnos
                  </div>
                ) : turnosRegistrados.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                    No hay turnos registrados para esta cocción
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">ID</TableHead>
                          <TableHead className="text-xs sm:text-sm">Horno</TableHead>
                          <TableHead className="text-xs sm:text-sm">Personal</TableHead>
                          <TableHead className="text-xs sm:text-sm">Cargo</TableHead>
                          <TableHead className="text-xs sm:text-sm">Fecha</TableHead>
                          <TableHead className="text-xs sm:text-sm">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {turnosRegistrados.map((turno) => (
                          <TableRow key={turno.id_coccion_personal}>
                            <TableCell className="text-xs sm:text-sm py-1">
                              {turno.coccion_id_coccion}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm py-1">
                              {turno.nombre_horno || getNombreHorno(
                                cocciones.find(c => c.id_coccion === turno.coccion_id_coccion)?.horno_id_horno ?? 0
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm py-1">
                              {turno.personal_externo || turno.nombre_personal || "Sin nombre"}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm py-1">
                              {turno.cargo || getNombreCargo(turno.cargo_coccion_id_cargo_coccion)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm py-1">
                              {formatDate(turno.fecha)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm py-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7" 
                                onClick={() => confirmDeleteTurno(turno.id_coccion_personal)}
                                title="Eliminar turno"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setTurnoModalOpen(false)}
                className="text-xs sm:text-sm flex-shrink-0"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar turno */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este turno? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)} 
              disabled={deletingTurno}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTurno} 
              disabled={deletingTurno}
            >
              {deletingTurno ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

