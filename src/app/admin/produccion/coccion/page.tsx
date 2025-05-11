"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { PlusCircle, Pencil, Trash2, Loader2, X, Flame, Users, Home } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Checkbox } from "@/components/ui/checkbox"
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
  id_coccion_operador: number
  coccion_id_coccion: number
  personal_id_personal: number
  cargo_coccion_id_cargo_coccion: number
  Personal: Personal
  CargoCocion: CargoCocion
}

export default function CoccionPage() {
  const { data: session } = useSession()

  // Estados para las pestañas
  const [activeTab, setActiveTab] = useState("coccion")

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
  const [operadores, setOperadores] = useState<CoccionOperador[]>([])
  const [currentOperadores, setCurrentOperadores] = useState<Partial<CoccionOperador>[]>([])
  const [showOperadoresModal, setShowOperadoresModal] = useState(false)
  const [loadingOperadores, setLoadingOperadores] = useState(false)
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loadingPersonal, setLoadingPersonal] = useState(true)
  const [selectedCoccionId, setSelectedCoccionId] = useState<number | null>(null)

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
  
      if (currentOperadores.length === 0) {
        toast.error("Debe seleccionar al menos un operador");
        return;
      }
  
      // Preparar datos para enviar
      const requestData = {
        ...(currentCoccion.id_coccion ? { // Solo incluir para actualización
          where: {
            id_coccion: currentCoccion.id_coccion
          }
        } : {}),
        coccion: {
          ...(currentCoccion.id_coccion && { id_coccion: currentCoccion.id_coccion }), // Incluir ID solo en actualización
          semana_trabajo_id_semana_trabajo: Number(currentCoccion.semana_trabajo_id_semana_trabajo),
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
        },
        operadores: currentOperadores.map(op => ({
          personal_id_personal: Number(op.personal_id_personal),
          cargo_coccion_id_cargo_coccion: Number(op.cargo_coccion_id_cargo_coccion)
        }))
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

  // Funciones para operadores de cocción
  const fetchOperadores = async (coccionId: number) => {
    try {
      setLoadingOperadores(true)
      const res = await fetch(`/api/coccion_personal?coccion_id_coccion=${coccionId}`)
      const data = await res.json()
      setOperadores(data)
      setSelectedCoccionId(coccionId)
    } catch (error) {
      toast.error("Error al cargar operadores")
      console.error(error)
    } finally {
      setLoadingOperadores(false)
    }
  }

  const handleSaveOperadores = async () => {
    if (!selectedCoccionId) return

    try {
      // Primero eliminamos los operadores existentes
      await fetch(`/api/coccion-operador?coccion_id_coccion=${selectedCoccionId}`, {
        method: "DELETE",
      })

      // Luego creamos los nuevos
      const operadoresData = currentOperadores.map((op) => ({
        ...op,
        coccion_id_coccion: selectedCoccionId,
      }))

      if (operadoresData.length > 0) {
        await fetch("/api/coccion-operador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(operadoresData),
        })
      }

      toast.success("Operadores guardados")
      setShowOperadoresModal(false)
      fetchOperadores(selectedCoccionId)
    } catch (error) {
      toast.error("Error al guardar operadores")
      console.error(error)
    }
  }

  const handleAddOperador = () => {
    setCurrentOperadores([...currentOperadores, { personal_id_personal: 0, cargo_coccion_id_cargo_coccion: 0 }])
  }

  const handleRemoveOperador = (index: number) => {
    const newOperadores = [...currentOperadores]
    newOperadores.splice(index, 1)
    setCurrentOperadores(newOperadores)
  }

  const handleOperadorChange = (index: number, field: string, value: any) => {
    const newOperadores = [...currentOperadores]
      ; (newOperadores[index] as any)[field] = value
    setCurrentOperadores(newOperadores)
  }

  const handleHornoChange = (value: string) => {
    const hornoId = Number(value);
    const hornoSelected = hornos.find(h => h.id_horno === hornoId);
    
    setCurrentCoccion({
      ...currentCoccion,
      horno_id_horno: hornoId,
    });
    
    // Limpiar los operadores al cambiar de horno
    setCurrentOperadores([]);
  };

  const handleCargoChange = (personalId: number, cargoId: number) => {
    const hornoSeleccionado = hornos.find(h => h.id_horno === currentCoccion.horno_id_horno);
    if (!hornoSeleccionado) return;

    const cargo = cargos.find(c => c.id_cargo_coccion === cargoId);
    if (!cargo) return;

    // Contar cuántos operadores hay de cada tipo
    const operadoresActuales = currentOperadores.reduce((acc, op) => {
      const cargoOp = cargos.find(c => c.id_cargo_coccion === op.cargo_coccion_id_cargo_coccion);
      if (cargoOp) {
        acc[cargoOp.nombre_cargo] = (acc[cargoOp.nombre_cargo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Verificar límites según el tipo de cargo
    if (cargo.nombre_cargo.toLowerCase().includes('humeador')) {
      if ((operadoresActuales['Humeador'] || 0) >= hornoSeleccionado.cantidad_humeadores) {
        toast.error(`Ya se han asignado todos los humeadores necesarios (${hornoSeleccionado.cantidad_humeadores})`);
        return;
      }
    } else if (cargo.nombre_cargo.toLowerCase().includes('quemador')) {
      if ((operadoresActuales['Quemador'] || 0) >= hornoSeleccionado.cantidad_quemadores) {
        toast.error(`Ya se han asignado todos los quemadores necesarios (${hornoSeleccionado.cantidad_quemadores})`);
        return;
      }
    }

    // Actualizar el operador
    const newOperadores = [...currentOperadores];
    const index = newOperadores.findIndex(op => op.personal_id_personal === personalId);
    if (index >= 0) {
      newOperadores[index].cargo_coccion_id_cargo_coccion = cargoId;
    } else {
      newOperadores.push({
        personal_id_personal: personalId,
        cargo_coccion_id_cargo_coccion: cargoId
      });
    }
    setCurrentOperadores(newOperadores);
  };

  const loadCoccionOperadores = async (coccionId: number) => {
    try {
      setLoadingOperadores(true);
      const res = await fetch(`/api/coccion?id_coccion=${coccionId}&include_personal=true`);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
  
      const operadores = await res.json();
      
      // Mapear directamente los operadores ya que vienen con las relaciones incluidas
      setCoccionOperadores(operadores.map((op: any) => ({
        id_coccion_operador: op.id_coccion_personal,
        coccion_id_coccion: op.coccion_id_coccion,
        personal_id_personal: op.personal_id_personal,
        cargo_coccion_id_cargo_coccion: op.cargo_coccion_id_cargo_coccion,
        Personal: op.personal,
        CargoCocion: op.cargo_coccion
      })));

    } catch (error) {
      console.error('Error al cargar operadores:', error);
      toast.error("Error al cargar operadores de la cocción");
      setCoccionOperadores([]);
    } finally {
      setLoadingOperadores(false);
    }
  };

  const formatDate = formatDateString

  // Añadir esta función helper para formatear fechas
  const formatSemanaLabel = (fecha_inicio: string, fecha_fin: string) => {
    return formatDateRange(fecha_inicio, fecha_fin)
  }

  const loadOperadoresCoccion = async (coccionId: number) => {
    try {
      const res = await fetch(`/api/coccion?id_coccion=${coccionId}&include_personal=true`);
      if (!res.ok) throw new Error('Error al cargar operadores');
      return await res.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Gestión de Cocción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            En este módulo puede gestionar las cocciones, cargos y hornos de manera eficiente.
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
                    <TableHead>Hora Inicio</TableHead>
                    <TableHead>Humedad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Humeada</TableHead>
                    <TableHead>Quema</TableHead>
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
                      <TableCell>{coccion.hora_inicio || '-'}</TableCell>
                      <TableCell>{coccion.humedad_inicial || '-'}</TableCell>                   <TableCell>
                        <Badge variant={
                          coccion.estado === "Finalizado" ? "destructive" :
                          coccion.estado === "En Proceso" ? "success" :
                          "info"
                        }>
                          {coccion.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coccion.humeada ? "default" : "outline"}>
                          {coccion.humeada ? "Sí" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coccion.quema ? "default" : "outline"}>
                          {coccion.quema ? "Sí" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              try {
                                setSelectedCoccion(coccion);
                                await loadCoccionOperadores(coccion.id_coccion);
                                setShowViewModal(true);
                              } catch (error) {
                                console.error('Error al cargar detalles:', error);
                                toast.error("Error al cargar detalles de la cocción");
                              }
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              try {
                                const operadores = await loadOperadoresCoccion(coccion.id_coccion);
                                
                                // Formatear la fecha correctamente para el input date
                                const fechaEncendido = coccion.fecha_encendido ? 
                                  coccion.fecha_encendido.split('T')[0] : '';
                                
                                // Establecer los operadores actuales
                                setCurrentOperadores(operadores.map((op: any) => ({
                                  personal_id_personal: op.personal_id_personal,
                                  cargo_coccion_id_cargo_coccion: op.cargo_coccion_id_cargo_coccion
                                })));
                                
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
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{currentCoccion.id_coccion ? "Editar Cocción" : "Nueva Cocción"}</DialogTitle>
            <DialogDescription>Complete los datos de la cocción y presione {currentCoccion.id_coccion ? "actualizar" : "guardar"}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            {/* Columna izquierda: Datos de cocción */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="semana">Semana Laboral</Label>
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
                        key={semana.id_semana_laboral} // Cambiar de id_semana_trabajo a id_semana_laboral
                        value={String(semana.id_semana_laboral)} // Cambiar de id_semana_trabajo a id_semana_laboral
                      >
                        {formatSemanaLabel(semana.fecha_inicio, semana.fecha_fin)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horno">Horno</Label>
                  <Select
                    value={String(currentCoccion.horno_id_horno || "")}
                    onValueChange={handleHornoChange}
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
                
                <div className="space-y-2">
                  <Label>Humeadores</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                    {hornos.find(h => h.id_horno === currentCoccion.horno_id_horno)?.cantidad_humeadores || '-'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Quemadores</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                    {hornos.find(h => h.id_horno === currentCoccion.horno_id_horno)?.cantidad_quemadores || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_encendido">Fecha de Encendido</Label>
                  <Input
                    id="fecha_encendido"
                    type="date"
                    value={currentCoccion.fecha_encendido || ""}
                    onChange={(e) => setCurrentCoccion({ ...currentCoccion, fecha_encendido: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora de Inicio</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={currentCoccion.hora_inicio || ""}
                    onChange={(e) => setCurrentCoccion({ ...currentCoccion, hora_inicio: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_apagado">Fecha de Apagado</Label>
                  <Input
                    id="fecha_apagado"
                    type="date"
                    value={currentCoccion.fecha_apagado || ""}
                    onChange={(e) => setCurrentCoccion({ ...currentCoccion, fecha_apagado: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_fin">Hora de Fin</Label>
                  <Input
                    id="hora_fin"
                    type="time"
                    value={currentCoccion.hora_fin || ""}
                    onChange={(e) => setCurrentCoccion({ ...currentCoccion, hora_fin: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="humedad_inicial">Humedad Inicial (%)</Label>
                  <Input
                    id="humedad_inicial"
                    type="number"
                    value={currentCoccion.humedad_inicial || ""}
                    onChange={(e) => setCurrentCoccion({ ...currentCoccion, humedad_inicial: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={currentCoccion.estado || ""}
                    onValueChange={(value) => setCurrentCoccion({ ...currentCoccion, estado: value })}
                  >
                    <SelectTrigger id="estado">
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

            {/* Columna derecha: Operadores */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Operadores</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {personal.map((persona) => {
                  const operadorActual = currentOperadores.find(op => op.personal_id_personal === persona.id_personal);
                  return (
                    <div key={persona.id_personal} className="flex gap-2 items-center border p-3 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{persona.nombre_completo}</p>
                      </div>
                      <div className="w-[200px]">
                        <Select
                          value={operadorActual?.cargo_coccion_id_cargo_coccion?.toString() || "0"} // Cambiado de "" a "0"
                          onValueChange={(value) => {
                            // Si el valor es "0", significa deseleccionar
                            const numericValue = Number(value);
                            if (numericValue === 0) {
                              // Remover el operador si existe
                              const newOperadores = currentOperadores.filter(
                                op => op.personal_id_personal !== persona.id_personal
                              );
                              setCurrentOperadores(newOperadores);
                            } else {
                              handleCargoChange(persona.id_personal, numericValue);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Seleccionar cargo</SelectItem> {/* Cambiado de "" a "0" */}
                            {cargos
                              .filter(c => c.id_horno === currentCoccion.horno_id_horno)
                              .map((c) => (
                                <SelectItem key={c.id_cargo_coccion} value={String(c.id_cargo_coccion)}>
                                  {c.nombre_cargo}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoccionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCoccion}>
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Gestión de Cargos</DialogTitle>
            <DialogDescription>Administre los cargos de cocción.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* Columna 1: Formulario de Cargos */}
            <div className="space-y-4 md:col-span-1">
              <div className="space-y-2">
                <Label htmlFor="horno">Horno</Label>
                <Select
                  value={currentCargo.id_horno?.toString() || ""} // Cambiar a id_horno
                  onValueChange={(value) =>
                    setCurrentCargo({ ...currentCargo, id_horno: Number(value) }) // Actualizar id_horno
                  }
                >
                  <SelectTrigger id="horno">
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
                <Label htmlFor="nombre_cargo">Nombre del Cargo</Label>
                <Input
                  id="nombre_cargo"
                  value={currentCargo.nombre_cargo || ""}
                  onChange={(e) => setCurrentCargo({ ...currentCargo, nombre_cargo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo_cargo">Costo del Cargo (S/.)</Label>
                <Input
                  id="costo_cargo"
                  type="number"
                  step="0.01"
                  value={currentCargo.costo_cargo || ""}
                  onChange={(e) => setCurrentCargo({ ...currentCargo, costo_cargo: Number(e.target.value) })}
                />
              </div>
              <Button onClick={handleSaveCargo}>Guardar Cargo</Button>
            </div>

            {/* Columna 2: Tabla de Cargos */}
            <div className="rounded-md border overflow-x-auto md:col-span-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prefijo del Horno</TableHead>
                    <TableHead>Nombre del Horno</TableHead>
                    <TableHead>Nombre del Cargo</TableHead>
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Gestión de Hornos</DialogTitle>
            <DialogDescription>Administre los hornos registrados.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Columna 1: Formulario de Hornos */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefijo">Prefijo</Label>
                  <Input
                    id="prefijo"
                    value={currentHorno.prefijo || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, prefijo: e.target.value })}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={currentHorno.nombre || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, nombre: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="humeadores">Cantidad de Humeadores</Label>
                  <Input
                    id="humeadores"
                    type="number"
                    value={currentHorno.cantidad_humeadores || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, cantidad_humeadores: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quemadores">Cantidad de Quemadores</Label>
                  <Input
                    id="quemadores"
                    type="number"
                    value={currentHorno.cantidad_quemadores || ""}
                    onChange={(e) => setCurrentHorno({ ...currentHorno, cantidad_quemadores: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveHorno}>Guardar Horno</Button>
            </div>

            {/* Columna 2: Tabla de Hornos */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prefijo</TableHead>
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cocción</DialogTitle>
          </DialogHeader>
          {selectedCoccion && (
            <div className="space-y-6">
              {/* Información detallada de la cocción */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Horno</Label>
                  <div className="text-lg font-medium">
                    {selectedCoccion.horno?.nombre || 'Horno no asignado'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Semana</Label>
                  <div className="text-lg font-medium">
                    {selectedCoccion.semana_laboral ? 
                      formatSemanaLabel(selectedCoccion.semana_laboral.fecha_inicio, selectedCoccion.semana_laboral.fecha_fin) : 
                      '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={
                    selectedCoccion.estado === "Finalizado" ? "destructive" :
                    selectedCoccion.estado === "En Proceso" ? "success" :
                    "info"
                  } className="text-base">
                    {selectedCoccion.estado}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Fecha de Inicio</Label>
                  <div className="text-lg font-medium">
                    {formatDate(selectedCoccion.fecha_encendido)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Hora de Inicio</Label>
                  <div className="text-lg font-medium">
                    {selectedCoccion.hora_inicio || '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Humedad Inicial</Label>
                  <div className="text-lg font-medium">
                    {selectedCoccion.humedad_inicial ? `${selectedCoccion.humedad_inicial}%` : '-'}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Tabla de operadores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Asignado</h3>
                {loadingOperadores ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : coccionOperadores.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay personal asignado a esta cocción.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coccionOperadores.map((operador) => (
                        <TableRow key={operador.id_coccion_operador || `${operador.coccion_id_coccion}-${operador.personal_id_personal}`}>
                          <TableCell>{operador.Personal?.nombre_completo || 'No asignado'}</TableCell>
                          <TableCell>{operador.CargoCocion?.nombre_cargo || 'No asignado'}</TableCell>
                          <TableCell>
                            {operador.CargoCocion?.costo_cargo 
                              ? `S/. ${Number(operador.CargoCocion.costo_cargo).toFixed(2)}` 
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
