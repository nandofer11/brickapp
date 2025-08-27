"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "react-toastify"
import { Pencil, Trash2, Loader2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDateString, formatDateRange, toISODateString } from '@/lib/utils/dates'
import { Separator } from "@/components/ui/separator"

// Interfaces
interface Horno {
  id_horno: number
  prefijo: string
  nombre: string
  cantidad_humeadores: number
  cantidad_quemadores: number
  id_empresa: number
}

interface CargoCocion {
  id_cargo_coccion: number
  nombre_cargo: string
  costo_cargo: number
  id_empresa: number
  id_horno?: number
}

interface SemanaLaboral {
  id_semana_laboral: number // Cambiar de id_semana_trabajo a id_semana_laboral
  fecha_inicio: string
  fecha_fin: string
  estado: number
}

interface Personal {
  id_personal: number
  nombre_completo: string
  estado: number
}

interface Coccion {
  id_coccion: number
  semana_trabajo_id_semana_trabajo?: number  // Hacer opcional
  semana_laboral_id_semana_laboral?: number  // Agregar esta propiedad
  fecha_encendido: string
  hora_inicio: string
  fecha_apagado: string
  hora_fin: string
  humedad_inicial: number
  estado: string
  horno_id_horno: number
  humeada: boolean
  quema: boolean
  hora_inicio_quema: string
  horno?: {
    id_horno: number
    prefijo: string
    nombre: string
    cantidad_humeadores: number
    cantidad_quemadores: number
  }
  semana_laboral?: {
    id_semana_laboral: number
    fecha_inicio: string
    fecha_fin: string
    estado: number
  }
  id_empresa: number
}

interface CoccionOperador {
  id_coccion_operador?: number
  id_coccion_personal?: number
  coccion_id_coccion: number
  personal_id_personal: number
  cargo_coccion_id_cargo_coccion: number
  Personal?: Personal
  CargoCocion?: CargoCocion
  cargo_coccion?: {
    id_cargo_coccion: number
    nombre_cargo: string
    costo_cargo: string
  }
  nombre_personal?: string
  nombre_horno?: string
  fecha?: string
  personal_externo?: string | null
}

export default function CoccionPage() {
  const { data: session } = useSession()


  // Estados para hornos
  const [hornos, setHornos] = useState<Horno[]>([])
  const [currentHorno, setCurrentHorno] = useState<Partial<Horno>>({})
  const [showHornoModal, setShowHornoModal] = useState(false)
  const [deleteHornoId, setDeleteHornoId] = useState<number | null>(null)
  const [showDeleteHornoDialog, setShowDeleteHornoDialog] = useState(false)
  const [loadingHornos, setLoadingHornos] = useState(true)

  // Estados para cargos de cocción
  const [cargos, setCargos] = useState<CargoCocion[]>([])
  const [currentCargo, setCurrentCargo] = useState<Partial<CargoCocion>>({})
  const [showCargoModal, setShowCargoModal] = useState(false)
  const [deleteCargoId, setDeleteCargoId] = useState<number | null>(null)
  const [showDeleteCargoDialog, setShowDeleteCargoDialog] = useState(false)
  const [loadingCargos, setLoadingCargos] = useState(true)

  // Estados para cocción
  const [cocciones, setCocciones] = useState<Coccion[]>([])
  const [currentCoccion, setCurrentCoccion] = useState<Partial<Coccion>>({})
  const [showCoccionModal, setShowCoccionModal] = useState(false)
  const [deleteCoccionId, setDeleteCoccionId] = useState<number | null>(null)
  const [showDeleteCoccionDialog, setShowDeleteCoccionDialog] = useState(false)
  const [loadingCocciones, setLoadingCocciones] = useState(true)
  const [semanas, setSemanas] = useState<SemanaLaboral[]>([])
  const [loadingSemanas, setLoadingSemanas] = useState(true)

  // Estados para operadores de cocción
  const [currentOperadores, setCurrentOperadores] = useState<Partial<CoccionOperador>[]>([])
  const [loadingOperadores, setLoadingOperadores] = useState(false)
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loadingPersonal, setLoadingPersonal] = useState(true)

  // Agregar estado para el modal de visualización
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCoccion, setSelectedCoccion] = useState<Coccion | null>(null)
  const [coccionOperadores, setCoccionOperadores] = useState<CoccionOperador[]>([])

  // Cargar datos iniciales
  useEffect(() => {
    document.title = "Gestión de Cocción"
    fetchHornos()
    fetchCargos()
    fetchSemanas()
    fetchPersonal()
    fetchCocciones() // Agregar esta línea

    // Establecer fecha y hora actual
    const now = new Date();
    setCurrentCoccion(prev => ({
      ...prev,
      fecha_encendido: toISODateString(now),
      hora_inicio: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      estado: "Programado"
    }));
  }, [])

  // Funciones para hornos
  const fetchHornos = async () => {
    try {
      setLoadingHornos(true)
      const res = await fetch("/api/horno")
      const data = await res.json()
      setHornos(data)
    } catch (error) {
      toast.error("Error al cargar hornos")
      console.error(error)
    } finally {
      setLoadingHornos(false)
    }
  }

  const handleSaveHorno = async () => {
    try {
      // Validaciones
      if (!currentHorno.prefijo?.trim()) {
        toast.error("El prefijo es obligatorio");
        setCurrentHorno({ ...currentHorno, prefijo: "" });
        document.getElementById("prefijo")?.focus();
        return;
      }

      if (!currentHorno.nombre?.trim()) {
        toast.error("El nombre es obligatorio");
        setCurrentHorno({ ...currentHorno, nombre: "" });
        document.getElementById("nombre")?.focus();
        return;
      }

      if (!currentHorno.cantidad_humeadores || isNaN(Number(currentHorno.cantidad_humeadores))) {
        toast.error("La cantidad de humeadores debe ser un número válido");
        setCurrentHorno({ ...currentHorno, cantidad_humeadores: undefined });
        document.getElementById("humeadores")?.focus();
        return;
      }

      if (!currentHorno.cantidad_quemadores || isNaN(Number(currentHorno.cantidad_quemadores))) {
        toast.error("La cantidad de quemadores debe ser un número válido");
        setCurrentHorno({ ...currentHorno, cantidad_quemadores: undefined });
        document.getElementById("quemadores")?.focus();
        return;
      }

      const method = currentHorno.id_horno ? "PUT" : "POST";

      // Filtrar los campos necesarios
      const { id_horno, prefijo, nombre, cantidad_humeadores, cantidad_quemadores } = currentHorno;

      const res = await fetch("/api/horno", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_horno, prefijo, nombre, cantidad_humeadores, cantidad_quemadores }),
      });

      if (!res.ok) {
        const errorData = await res.json();

        // Detectar error por prefijo duplicado (código 409 del backend)
        if (res.status === 409 && errorData.message === "El prefijo ya existe") {
          toast.error("El prefijo ya está en uso. Por favor ingrese otro.");
          setCurrentHorno({ ...currentHorno, prefijo: "" });
          setTimeout(() => {
            document.getElementById("prefijo")?.focus();
          }, 100);
          return;
        }

        throw new Error(errorData.message || "Error al guardar horno");
      }

      toast.success(currentHorno.id_horno ? "Horno actualizado" : "Horno creado");
      // setShowHornoModal(false);
      setCurrentHorno({}); // Limpiar el formulario
      fetchHornos(); // Volver a cargar los datos
    } catch (error) {
      toast.error("Error al guardar horno");
      console.error(error);
    }
  };


  const handleDeleteHorno = async () => {
    if (!deleteHornoId) return

    try {
      const res = await fetch(`/api/horno?id_horno=${deleteHornoId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error al eliminar horno")

      toast.success("Horno eliminado")
      setShowDeleteHornoDialog(false)
      fetchHornos(); // Volver a cargar los datos
    } catch (error) {
      toast.error("Error al eliminar horno")
      console.error(error)
    }
  }

  // Funciones para cargos de cocción
  const fetchCargos = async () => {
    try {
      setLoadingCargos(true)
      const res = await fetch("/api/cargo_coccion")
      const data = await res.json()
      setCargos(data)
    } catch (error) {
      toast.error("Error al cargar cargos")
      console.error(error)
    } finally {
      setLoadingCargos(false)
    }
  }

  const handleSaveCargo = async () => {
    try {
      // Validaciones
      if (!currentCargo.id_horno) {
        toast.error("Debe seleccionar un horno");
        document.getElementById("horno")?.focus();
        return;
      }

      if (!currentCargo.nombre_cargo?.trim()) {
        toast.error("El nombre del cargo es obligatorio");
        setCurrentCargo({ ...currentCargo, nombre_cargo: "" });
        document.getElementById("nombre_cargo")?.focus();
        return;
      }

      if (!currentCargo.costo_cargo || isNaN(Number(currentCargo.costo_cargo))) {
        toast.error("El costo del cargo es obligatorio y debe ser un número válido");
        setCurrentCargo({ ...currentCargo, costo_cargo: undefined });
        document.getElementById("costo_cargo")?.focus();
        return;
      }

      const method = currentCargo.id_cargo_coccion ? "PUT" : "POST";
      const { id_cargo_coccion, id_empresa = session?.user?.id_empresa, nombre_cargo, costo_cargo, id_horno } = currentCargo;

      const res = await fetch("/api/cargo_coccion", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cargo_coccion, id_empresa, nombre_cargo, costo_cargo, id_horno }),
      });

      if (!res.ok) throw new Error("Error al guardar cargo");

      toast.success(currentCargo.id_cargo_coccion ? "Cargo actualizado" : "Cargo creado");
      setCurrentCargo({}); // Limpiar el formulario
      fetchCargos();
    } catch (error) {
      toast.error("Error al guardar cargo");
      console.error(error);
    }
  };

  const handleDeleteCargo = async () => {
    if (!deleteCargoId) return

    try {
      const res = await fetch(`/api/cargo_coccion?id_cargo_coccion=${deleteCargoId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error al eliminar cargo")

      toast.success("Cargo eliminado")
      setShowDeleteCargoDialog(false)
      fetchCargos()
    } catch (error) {
      toast.error("Error al eliminar cargo")
      console.error(error)
    }
  }

  // Funciones para semanas laborales
  const fetchSemanas = async () => {
    try {
      setLoadingSemanas(true);
      const res = await fetch("/api/semana_laboral");
      const data = await res.json();

      // Asegurarnos de que las fechas se procesen correctamente
      const semanasFormateadas = data
        .filter((s: SemanaLaboral | null) => s && s.estado === 1)
        .map((semana: SemanaLaboral) => ({
          ...semana,
          fecha_inicio: semana.fecha_inicio.split('T')[0], // Mantener solo la fecha
          fecha_fin: semana.fecha_fin.split('T')[0], // Mantener solo la fecha
        }));

      setSemanas(semanasFormateadas);
    } catch (error) {
      toast.error("Error al cargar semanas laborales");
      console.error(error);
      setSemanas([]);
    } finally {
      setLoadingSemanas(false);
    }
  };

  // Funciones para personal
  const fetchPersonal = async () => {
    try {
      setLoadingPersonal(true)
      const res = await fetch("/api/personal")
      const data = await res.json()
      setPersonal(data.filter((p: Personal) => p.estado === 1))
    } catch (error) {
      toast.error("Error al cargar personal")
      console.error(error)
    } finally {
      setLoadingPersonal(false)
    }
  }

  // Funciones para cocción
  const fetchCocciones = async () => {
    try {
      setLoadingCocciones(true)
      const res = await fetch("/api/coccion?include_relations=true")
      let data = await res.json()
      setCocciones(data)
    } catch (error) {
      toast.error("Error al cargar cocciones")
      console.error(error)
    } finally {
      setLoadingCocciones(false)
    }
  }

  const handleSaveCoccion = async () => {
    try {
      // Validaciones básicas
      if (!currentCoccion.semana_trabajo_id_semana_trabajo ||
        !currentCoccion.horno_id_horno ||
        !currentCoccion.fecha_encendido) {
        toast.error("Los campos semana, horno y fecha de encendido son obligatorios");
        return;
      }
      // Preparar datos para enviar
      const requestData = {
        ...(currentCoccion.id_coccion ? { id_coccion: currentCoccion.id_coccion } : {}),
        semana_laboral_id_semana_laboral: Number(currentCoccion.semana_trabajo_id_semana_trabajo),
        fecha_encendido: currentCoccion.fecha_encendido,
        hora_inicio: currentCoccion.hora_inicio || null,
        fecha_apagado: currentCoccion.fecha_apagado || null,
        hora_fin: currentCoccion.hora_fin || null,
        humedad_inicial: currentCoccion.humedad_inicial || null,
        estado: currentCoccion.estado || "Programado",
        horno_id_horno: Number(currentCoccion.horno_id_horno),
        humeada: currentCoccion.humeada || false,
        quema: currentCoccion.quema || false,
        id_empresa: session?.user?.id_empresa
      };

      console.log('Datos a enviar:', requestData);

      const res = await fetch("/api/coccion", {
        method: currentCoccion.id_coccion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar cocción");
      }

      toast.success(currentCoccion.id_coccion ? "Cocción actualizada" : "Cocción creada");
      setShowCoccionModal(false);
      setCurrentCoccion({});
      setCurrentOperadores([]);
      fetchCocciones();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error instanceof Error ? error.message : "Error al guardar la cocción");
    }
  };

  const handleDeleteCoccion = async () => {
    if (!deleteCoccionId) return;

    try {
      // Modificar la URL para usar query params en lugar de path params
      const res = await fetch(`/api/coccion?id_coccion=${deleteCoccionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar cocción");
      }

      toast.success("Cocción eliminada exitosamente");
      setShowDeleteCoccionDialog(false);
      setDeleteCoccionId(null);
      fetchCocciones(); // Recargar la tabla
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error("Error al eliminar la cocción");
    }
  };


  const loadCoccionOperadores = async (coccionId: number) => {
    try {
      setLoadingOperadores(true);
      // Obtenemos los turnos de cocción asociados a esta cocción
      const res = await fetch(`/api/coccion_turno?id_coccion=${coccionId}`);
      if (!res.ok) throw new Error('Error al cargar operadores de la cocción');

      const data = await res.json();
      console.log('Datos cargados:', data);

      // Verificamos si la respuesta es un array o un objeto único
      const turnos = Array.isArray(data) ? data : [data];
      console.log('Turnos procesados:', turnos);

      // Si no hay turnos, establecemos un array vacío
      if (!turnos || turnos.length === 0 || !turnos[0]) {
        setCoccionOperadores([]);
        return [];
      }

      // Agrupamos por personal y cargo para evitar duplicados
      const personalAgrupado: Record<string, CoccionOperador> = {};

      turnos.forEach((turno: CoccionOperador) => {
        // Creamos una clave única combinando el ID del personal y el ID del cargo
        const key = `${turno.personal_id_personal}-${turno.cargo_coccion_id_cargo_coccion}`;

        // Solo añadimos el turno si no existe ya uno con la misma combinación de personal y cargo
        if (!personalAgrupado[key]) {
          personalAgrupado[key] = turno;
        }
      });

      // Convertimos el objeto agrupado a un array
      const operadoresUnicos: CoccionOperador[] = Object.values(personalAgrupado);
      console.log('Operadores únicos:', operadoresUnicos);

      // Actualizamos el estado con los operadores únicos
      setCoccionOperadores(operadoresUnicos);

      return operadoresUnicos;
    } catch (error) {
      console.error('Error al cargar operadores:', error);
      toast.error("Error al cargar personal asignado a esta cocción");
      setCoccionOperadores([]);
      throw error;
    } finally {
      setLoadingOperadores(false);
    }
  };

  const formatDate = formatDateString

  // Añadir esta función helper para formatear fechas
  const formatSemanaLabel = (fecha_inicio: string, fecha_fin: string) => {
    return formatDateRange(fecha_inicio, fecha_fin)
  }


  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Gestión de Cocción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            En este módulo puede gestionar las cocciones, cargos y hornos.
          </p>
          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => {
                setCurrentCoccion({
                  fecha_encendido: toISODateString(new Date()),
                  estado: "Programado",
                });
                setCurrentOperadores([]);
                setShowCoccionModal(true);
              }}
              className="cursor-pointer"
            >
              Nueva Cocción
            </Button>
            <Button
              onClick={() => setShowCargoModal(true)}
              className="cursor-pointer"
            >
              Cargos
            </Button>
            <Button
              onClick={() => setShowHornoModal(true)}
              className="cursor-pointer"
            >
              Hornos
            </Button>
          </div>

          {loadingCocciones ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando datos...</span>
            </div>
          ) : cocciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay cocciones registradas.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Semana</TableHead>
                    <TableHead>Horno</TableHead>
                    <TableHead>Fecha Encendido</TableHead>
                    {/* <TableHead>Hora Inicio</TableHead> */}
                    <TableHead>Fecha Apagado</TableHead>
                    {/* <TableHead>Humedad</TableHead> */}
                    <TableHead>Estado</TableHead>
                    {/* <TableHead>Humeada</TableHead>
                    <TableHead>Quema</TableHead> */}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cocciones.map((coccion) => (
                    <TableRow key={coccion.id_coccion}>
                      <TableCell>{coccion.id_coccion}</TableCell>
                      <TableCell>
                        {coccion.semana_laboral ?
                          formatSemanaLabel(coccion.semana_laboral.fecha_inicio, coccion.semana_laboral.fecha_fin) :
                          `${coccion.semana_laboral_id_semana_laboral || coccion.semana_trabajo_id_semana_trabajo}`}
                      </TableCell>
                      <TableCell>{coccion.horno?.nombre || 'Horno no asignado'}</TableCell>
                      <TableCell>{formatDate(coccion.fecha_encendido)}</TableCell>
                      {/* <TableCell>{coccion.hora_inicio || '-'}</TableCell> */}
                      <TableCell>{coccion.fecha_apagado ? formatDate(coccion.fecha_apagado) : '-'}</TableCell>
                      {/* <TableCell>{coccion.humedad_inicial || '-'}</TableCell> */}
                      <TableCell>
                        <Badge 
                          className={
                            coccion.estado === "En Proceso" ? 
                            "bg-green-100 text-green-800 hover:bg-green-100" : 
                            coccion.estado === "Finalizado" ? 
                            "bg-red-50 text-red-600 hover:bg-red-50" : 
                            ""
                          }
                        >
                          {coccion.estado}
                        </Badge>
                      </TableCell>
                      {/* <TableCell><Badge variant={coccion.humeada ? "default" : "outline"}>
                        {coccion.humeada ? "Sí" : "No"}
                      </Badge></TableCell>
                      <TableCell><Badge variant={coccion.quema ? "default" : "outline"}>
                        {coccion.quema ? "Sí" : "No"}
                      </Badge></TableCell> */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              try {
                                // Establecer el estado de carga
                                setLoadingOperadores(true);
                                setSelectedCoccion(coccion);
                                await loadCoccionOperadores(coccion.id_coccion);
                                setShowViewModal(true);
                              } catch (error) {
                                console.error('Error al cargar detalles:', error);
                                toast.error("Error al cargar detalles de la cocción");
                              } finally {
                                // Asegurar que el estado de carga se desactive incluso en caso de error
                                setLoadingOperadores(false);
                              }
                            }}
                          >
                            {loadingOperadores && selectedCoccion?.id_coccion === coccion.id_coccion ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              try {
                                // Ya no necesitamos cargar operadores, así que eliminamos esa parte
                                // Simplemente cargamos la cocción
                                const res = await fetch(`/api/coccion?id_coccion=${coccion.id_coccion}`);
                                if (!res.ok) throw new Error('Error al cargar datos de cocción');

                                const coccionData = await res.json();

                                // Formatear la fecha correctamente para el input date
                                const fechaEncendido = coccion.fecha_encendido ?
                                  coccion.fecha_encendido.split('T')[0] : '';

                                // Ya no establecemos operadores, solo la cocción
                                setCurrentOperadores([]);

                                // Establecer la cocción actual con la fecha formateada
                                setCurrentCoccion({
                                  ...coccion,
                                  fecha_encendido: fechaEncendido,
                                  semana_trabajo_id_semana_trabajo: coccion.semana_laboral_id_semana_laboral
                                });

                                setShowCoccionModal(true);
                              } catch (error) {
                                console.error('Error al cargar datos para editar:', error);
                                toast.error("Error al cargar los datos para editar");
                              }
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeleteCoccionId(coccion.id_coccion)
                              setShowDeleteCoccionDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cocción */}
      <Dialog
        open={showCoccionModal}
        onOpenChange={(isOpen) => {
          setShowCoccionModal(isOpen);
          if (!isOpen) setCurrentCoccion({}); // Limpiar el formulario al cerrar
        }}
      >
        <DialogContent className="sm:max-w-[95%] md:max-w-[600px] p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              {currentCoccion.id_coccion ? "Editar Cocción" : "Nueva Cocción"}
            </DialogTitle>
            <DialogDescription>
              Complete los datos de la cocción y presione {currentCoccion.id_coccion ? "actualizar" : "guardar"}.
            </DialogDescription>
          </DialogHeader>

          {/* Formulario de Cocción - Solo datos básicos */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="semana" className="font-medium">Semana Laboral</Label>
                <Select
                  value={currentCoccion.semana_trabajo_id_semana_trabajo ?
                    String(currentCoccion.semana_trabajo_id_semana_trabajo) : undefined}
                  onValueChange={(value) => {
                    const semanaId = Number(value);
                    setCurrentCoccion(prev => ({
                      ...prev,
                      semana_trabajo_id_semana_trabajo: semanaId
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar semana" />
                  </SelectTrigger>
                  <SelectContent>
                    {semanas.map((semana) => (
                      <SelectItem
                        key={semana.id_semana_laboral}
                        value={String(semana.id_semana_laboral)}
                      >
                        {formatSemanaLabel(semana.fecha_inicio, semana.fecha_fin)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horno" className="font-medium">Horno</Label>
                <Select
                  value={String(currentCoccion.horno_id_horno || "")}
                  onValueChange={(value) => setCurrentCoccion({
                    ...currentCoccion,
                    horno_id_horno: Number(value)
                  })}
                >
                  <SelectTrigger id="horno">
                    <SelectValue placeholder="Seleccionar horno" />
                  </SelectTrigger>
                  <SelectContent>
                    {hornos.map((horno) => (
                      <SelectItem key={horno.id_horno} value={String(horno.id_horno)}>
                        {horno.prefijo} - {horno.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_encendido" className="font-medium">Fecha de Encendido</Label>
                <Input
                  id="fecha_encendido"
                  type="date"
                  value={currentCoccion.fecha_encendido || ""}
                  onChange={(e) => setCurrentCoccion({ ...currentCoccion, fecha_encendido: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_inicio" className="font-medium">Hora de Inicio</Label>
                <Input
                  id="hora_inicio"
                  type="time"
                  value={currentCoccion.hora_inicio || ""}
                  onChange={(e) => setCurrentCoccion({ ...currentCoccion, hora_inicio: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_apagado" className="font-medium">Fecha de Apagado</Label>
                <Input
                  id="fecha_apagado"
                  type="date"
                  value={currentCoccion.fecha_apagado || ""}
                  onChange={(e) => setCurrentCoccion({ ...currentCoccion, fecha_apagado: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_fin" className="font-medium">Hora de Fin</Label>
                <Input
                  id="hora_fin"
                  type="time"
                  value={currentCoccion.hora_fin || ""}
                  onChange={(e) => setCurrentCoccion({ ...currentCoccion, hora_fin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="humedad_inicial" className="font-medium">Humedad Inicial (%)</Label>
                <Input
                  id="humedad_inicial"
                  type="number"
                  value={currentCoccion.humedad_inicial || ""}
                  onChange={(e) => setCurrentCoccion({ ...currentCoccion, humedad_inicial: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado" className="font-medium">Estado</Label>
                <Select
                  value={currentCoccion.estado || ""}
                  onValueChange={(value) => setCurrentCoccion({ ...currentCoccion, estado: value })}
                >
                  <SelectTrigger id="estado" className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programado">Programado</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowCoccionModal(false)}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleSaveCoccion}>
              {currentCoccion.id_coccion ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Modal de Cargos */}
      <Dialog
        open={showCargoModal}
        onOpenChange={(isOpen) => {
          setShowCargoModal(isOpen);
          if (!isOpen) setCurrentCargo({}); // Limpiar el formulario al cerrar
        }}
      >
        <DialogContent className="sm:max-w-[95%] md:max-w-[800px] p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Gestión de Cargos</DialogTitle>
            <DialogDescription>Administre los cargos de cocción según el horno.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* Columna 1: Formulario de Cargos */}
            <div className="space-y-4 md:col-span-1 bg-muted/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold border-b pb-2">Datos del Cargo</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="horno" className="font-medium">Horno</Label>
                  <Select
                    value={currentCargo.id_horno?.toString() || ""} // Cambiar a id_horno
                    onValueChange={(value) =>
                      setCurrentCargo({ ...currentCargo, id_horno: Number(value) }) // Actualizar id_horno
                    }
                  >
                    <SelectTrigger id="horno" className="w-full">
                      <SelectValue placeholder="Seleccionar horno" />
                    </SelectTrigger>
                    <SelectContent>
                      {hornos.map((horno) => (
                        <SelectItem key={horno.id_horno} value={horno.id_horno.toString()}>
                          {horno.prefijo} - {horno.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_cargo" className="font-medium">Nombre del Cargo</Label>
                  <Input
                    id="nombre_cargo"
                    value={currentCargo.nombre_cargo || ""}
                    onChange={(e) => setCurrentCargo({ ...currentCargo, nombre_cargo: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo_cargo" className="font-medium">Costo del Cargo (S/.)</Label>
                  <Input
                    id="costo_cargo"
                    type="number"
                    step="0.01"
                    value={currentCargo.costo_cargo || ""}
                    onChange={(e) => setCurrentCargo({ ...currentCargo, costo_cargo: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSaveCargo} className="w-full sm:w-auto">
                    {currentCargo.id_cargo_coccion ? "Actualizar Cargo" : "Guardar Cargo"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Columna 2: Tabla de Cargos */}
            <div className="rounded-lg overflow-x-auto md:col-span-2 bg-muted/20 p-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Cargos Registrados</h3>
              <div className="rounded-md border overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cod. Horno</TableHead>
                      <TableHead>Horno</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargos.map((cargo) => {
                      const horno = hornos.find((h) => h.id_horno === cargo.id_horno);
                      return (
                        <TableRow key={cargo.id_cargo_coccion}>
                          <TableCell>{horno?.prefijo || "-"}</TableCell>
                          <TableCell>{horno?.nombre || "-"}</TableCell>
                          <TableCell>{cargo.nombre_cargo}</TableCell>
                          <TableCell>S/. {Number(cargo.costo_cargo).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setCurrentCargo(cargo);
                                  setShowCargoModal(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteCargoId(cargo.id_cargo_coccion);
                                  setShowDeleteCargoDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Hornos */}
      <Dialog
        open={showHornoModal}
        onOpenChange={(isOpen) => {
          setShowHornoModal(isOpen);
          if (!isOpen) setCurrentHorno({}); // Limpiar el formulario al cerrar
        }}
      >
        <DialogContent className="sm:max-w-[95%] md:max-w-[800px] p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Gestión de Hornos</DialogTitle>
            <DialogDescription>Administre los hornos registrados.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Columna 1: Formulario de Hornos */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold border-b pb-2">Datos del Horno</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefijo" className="font-medium">Cód. de Horno</Label>
                  <Input
                    id="prefijo"
                    value={currentHorno.prefijo || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, prefijo: e.target.value })}
                    maxLength={5}
                    placeholder="Ej: H1, H2, etc."
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="font-medium">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Nombre del horno"
                    value={currentHorno.nombre || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, nombre: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="humeadores" className="font-medium">Cantidad de Humeadores</Label>
                  <Input
                    id="humeadores"
                    type="number"
                    placeholder="Nro. de humeadores"
                    value={currentHorno.cantidad_humeadores || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, cantidad_humeadores: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quemadores" className="font-medium">Cantidad de Quemadores</Label>
                  <Input
                    placeholder="Nro. de quemadores"
                    id="quemadores"
                    type="number"
                    value={currentHorno.cantidad_quemadores || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, cantidad_quemadores: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveHorno} className="w-full sm:w-auto">
                  {currentHorno.id_horno ? "Actualizar Horno" : "Guardar Horno"}
                </Button>
              </div>
            </div>

            {/* Columna 2: Tabla de Hornos */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">Hornos Registrados</h3>
              <div className="rounded-md border overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cód.</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Humeadores</TableHead>
                      <TableHead>Quemadores</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hornos.map((horno) => (
                      <TableRow key={horno.id_horno}>
                        <TableCell>{horno.prefijo}</TableCell>
                        <TableCell>{horno.nombre}</TableCell>
                        <TableCell>{horno.cantidad_humeadores || "-"}</TableCell>
                        <TableCell>{horno.cantidad_quemadores || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setCurrentHorno(horno);
                                setShowHornoModal(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteHornoId(horno.id_horno);
                                setShowDeleteHornoDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogos de confirmación */}
      {/* Diálogo de confirmación para eliminar cocción  */}
      <AlertDialog open={showDeleteCoccionDialog} onOpenChange={setShowDeleteCoccionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar esta cocción? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoccion} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar cargo */}
      <AlertDialog open={showDeleteCargoDialog} onOpenChange={setShowDeleteCargoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar este cargo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCargo} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar horno */}
      <AlertDialog open={showDeleteHornoDialog} onOpenChange={setShowDeleteHornoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar este horno? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHorno} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de visualización */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="w-[94%] max-w-[95%] sm:max-w-xl p-2 sm:p-4 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-1 sm:mb-2">
            <DialogTitle className="text-base sm:text-lg font-bold">Detalles de la Cocción</DialogTitle>
          </DialogHeader>
          {selectedCoccion && (
            <div className="space-y-2 sm:space-y-3">
              {/* Información detallada de la cocción - Estilo ticket más compacto */}
              <div className="bg-muted/10 p-1 sm:p-2 rounded-lg border border-muted-foreground/20">
                <div className="flex flex-col space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between border-b pb-1 items-center">
                    <span className="font-medium text-muted-foreground">Horno:</span>
                    <span className="font-semibold text-right">{selectedCoccion.horno?.nombre || 'No asignado'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 items-center">
                    <span className="font-medium text-muted-foreground">Estado:</span>
                    <Badge
                      className={
                        selectedCoccion.estado === "En Proceso" ? 
                        "bg-green-100 text-green-800 hover:bg-green-100 text-xs" : 
                        selectedCoccion.estado === "Finalizado" ? 
                        "bg-red-50 text-red-600 hover:bg-red-50 text-xs" : 
                        "text-xs"
                      }
                    >
                      {selectedCoccion.estado}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b pb-1 items-center">
                    <span className="font-medium text-muted-foreground">Semana:</span>
                    <span className="font-semibold text-right text-xs truncate max-w-[180px]">
                      {selectedCoccion.semana_laboral ?
                        formatSemanaLabel(selectedCoccion.semana_laboral.fecha_inicio, selectedCoccion.semana_laboral.fecha_fin) :
                        '-'}
                    </span>
                  </div>

                  <div className="flex flex-wrap">
                    <div className="w-1/2 pr-1">
                      <div className="flex justify-between border-b pb-1 items-center">
                        <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">F. Inicio:</span>
                        <span className="font-semibold text-right text-[10px] sm:text-xs">{formatDate(selectedCoccion.fecha_encendido)}</span>
                      </div>
                    </div>
                    <div className="w-1/2 pl-1">
                      <div className="flex justify-between border-b pb-1 items-center">
                        <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">H. Inicio:</span>
                        <span className="font-semibold text-right text-[10px] sm:text-xs">{selectedCoccion.hora_inicio || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap">
                    <div className="w-1/2 pr-1">
                      <div className="flex justify-between border-b pb-1 items-center">
                        <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">F. Fin:</span>
                        <span className="font-semibold text-right text-[10px] sm:text-xs">
                          {selectedCoccion.fecha_apagado ? formatDate(selectedCoccion.fecha_apagado) : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="w-1/2 pl-1">
                      <div className="flex justify-between border-b pb-1 items-center">
                        <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">H. Fin:</span>
                        <span className="font-semibold text-right text-[10px] sm:text-xs">{selectedCoccion.hora_fin || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between border-b pb-1 items-center">
                    <span className="font-medium text-muted-foreground">Humedad:</span>
                    <span className="font-semibold text-right">
                      {selectedCoccion.humedad_inicial ? `${selectedCoccion.humedad_inicial}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-1 sm:my-2" />

              {/* Tabla de operadores */}
              <div className="space-y-1 sm:space-y-2 bg-muted/20 p-2 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Personal Asignado
                </h3>
                {loadingOperadores ? (
                  <div className="flex justify-center py-1 sm:py-2">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  </div>
                ) : coccionOperadores.length === 0 ? (
                  <div className="text-center py-1 text-muted-foreground text-[10px] sm:text-xs">
                    No hay personal asignado a esta cocción.
                  </div>
                ) : (
                  <div className="w-full overflow-hidden rounded-md border">
                    <div className="w-full overflow-x-visible">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap text-[10px] sm:text-xs p-1 sm:p-2 w-[40%]">Nombre</TableHead>
                            <TableHead className="whitespace-nowrap text-[10px] sm:text-xs p-1 sm:p-2 w-[40%]">Cargo</TableHead>
                            <TableHead className="whitespace-nowrap text-[10px] sm:text-xs p-1 sm:p-2 w-[20%]">Costo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coccionOperadores.map((operador, index) => (
                            <TableRow key={operador.id_coccion_personal || operador.id_coccion_operador || `${index}-${operador.coccion_id_coccion}-${operador.personal_id_personal}`}>
                              <TableCell className="p-1 sm:p-2 text-[10px] sm:text-xs truncate">{operador.nombre_personal || operador.Personal?.nombre_completo || 'No asignado'}</TableCell>
                              <TableCell className="p-1 sm:p-2 text-[10px] sm:text-xs truncate">{operador.cargo_coccion?.nombre_cargo || operador.CargoCocion?.nombre_cargo || 'No asignado'}</TableCell>
                              <TableCell className="p-1 sm:p-2 text-[10px] sm:text-xs">
                                {(operador.cargo_coccion?.costo_cargo || operador.CargoCocion?.costo_cargo)
                                  ? `S/. ${Number(operador.cargo_coccion?.costo_cargo || operador.CargoCocion?.costo_cargo).toFixed(2)}`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
