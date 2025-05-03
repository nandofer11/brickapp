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
  id_semana_trabajo: number
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
  semana_trabajo_id_semana_trabajo: number
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
  Horno?: Horno
  SemanaLaboral?: SemanaLaboral
  id_empresa: number
}

interface CoccionOperador {
  id_coccion_operador: number
  coccion_id_coccion: number
  personal_id_personal: number
  cargo_coccion_id_cargo_coccion: number
  Personal?: Personal
  CargoCocion?: CargoCocion
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

  // Cargar datos iniciales
  useEffect(() => {
    document.title = "Gestión de Cocción"
    fetchHornos()
    fetchCargos()
    fetchCocciones()
    // fetchSemanas()
    fetchPersonal()
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
  // const fetchSemanas = async () => {
  //   try {
  //     setLoadingSemanas(true)
  //     const res = await fetch("/api/semana_laboral")
  //     const data = await res.json()
  //     setSemanas(data)
  //   } catch (error) {
  //     toast.error("Error al cargar semanas laborales")
  //     console.error(error)
  //   } finally {
  //     setLoadingSemanas(false)
  //   }
  // }

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
      const res = await fetch("/api/coccion")
      const data = await res.json()
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
      const method = currentCoccion.id_coccion ? "PUT" : "POST"
      const res = await fetch("/api/coccion", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentCoccion),
      })

      if (!res.ok) throw new Error("Error al guardar cocción")

      const data = await res.json()
      toast.success(currentCoccion.id_coccion ? "Cocción actualizada" : "Cocción creada")

      // Si es una nueva cocción y tenemos operadores, los guardamos
      if (!currentCoccion.id_coccion && currentOperadores.length > 0) {
        const operadoresData = currentOperadores.map((op) => ({
          ...op,
          coccion_id_coccion: data.id_coccion,
        }))

        await fetch("/api/coccion-operador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(operadoresData),
        })
      }

      setShowCoccionModal(false)
      fetchCocciones()
    } catch (error) {
      toast.error("Error al guardar cocción")
      console.error(error)
    }
  }

  const handleDeleteCoccion = async () => {
    if (!deleteCoccionId) return

    try {
      const res = await fetch(`/api/coccion?id_coccion=${deleteCoccionId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error al eliminar cocción")

      toast.success("Cocción eliminada")
      setShowDeleteCoccionDialog(false)
      fetchCocciones()
    } catch (error) {
      toast.error("Error al eliminar cocción")
      console.error(error)
    }
  }

  // Funciones para operadores de cocción
  const fetchOperadores = async (coccionId: number) => {
    try {
      setLoadingOperadores(true)
      const res = await fetch(`/api/coccion-operador?coccion_id_coccion=${coccionId}`)
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

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

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
                  fecha_encendido: new Date().toISOString().split("T")[0],
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
                    <TableHead>Horno</TableHead>
                    <TableHead>Semana</TableHead>
                    <TableHead>Fecha Encendido</TableHead>
                    <TableHead>Hora Inicio</TableHead>
                    <TableHead>Fecha Apagado</TableHead>
                    <TableHead>Hora Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Humeada</TableHead>
                    <TableHead>Quema</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                {/* ...existing code for rendering table rows... */}
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{currentCoccion.id_coccion ? "Editar Cocción" : "Nueva Cocción"}</DialogTitle>
            <DialogDescription>Complete los datos de la cocción y presione guardar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semana">Semana Laboral</Label>
                <Select
                  value={currentCoccion.semana_trabajo_id_semana_trabajo?.toString() || ""}
                  onValueChange={(value) =>
                    setCurrentCoccion({
                      ...currentCoccion,
                      semana_trabajo_id_semana_trabajo: Number(value),
                    })
                  }
                >
                  <SelectTrigger id="semana">
                    <SelectValue placeholder="Seleccionar semana" />
                  </SelectTrigger>
                  <SelectContent>
                    {semanas.map((semana) => (
                      <SelectItem key={semana.id_semana_trabajo} value={semana.id_semana_trabajo.toString()}>
                        {formatDate(semana.fecha_inicio)} - {formatDate(semana.fecha_fin)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="horno">Horno</Label>
                <Select
                  value={currentCoccion.horno_id_horno?.toString() || ""}
                  onValueChange={(value) =>
                    setCurrentCoccion({
                      ...currentCoccion,
                      horno_id_horno: Number(value),
                    })
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="hora_inicio_quema">Hora Inicio Quema</Label>
                <Input
                  id="hora_inicio_quema"
                  type="time"
                  value={currentCoccion.hora_inicio_quema || ""}
                  onChange={(e) => setCurrentCoccion({ ...currentCoccion, hora_inicio_quema: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="humeada"
                  checked={currentCoccion.humeada || false}
                  onCheckedChange={(checked) => setCurrentCoccion({ ...currentCoccion, humeada: checked === true })}
                />
                <Label htmlFor="humeada">Humeada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quema"
                  checked={currentCoccion.quema || false}
                  onCheckedChange={(checked) => setCurrentCoccion({ ...currentCoccion, quema: checked === true })}
                />
                <Label htmlFor="quema">Quema</Label>
              </div>
            </div>

            {!currentCoccion.id_coccion && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Operadores</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOperador}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Agregar Operador
                  </Button>
                </div>

                {currentOperadores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay operadores asignados.</p>
                ) : (
                  <div className="space-y-3">
                    {currentOperadores.map((operador, index) => (
                      <div key={index} className="flex items-end gap-2 border p-3 rounded-md">
                        <div className="flex-1 space-y-2">
                          <Label>Personal</Label>
                          <Select
                            value={operador.personal_id_personal?.toString() || ""}
                            onValueChange={(value) =>
                              handleOperadorChange(index, "personal_id_personal", Number(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar personal" />
                            </SelectTrigger>
                            <SelectContent>
                              {personal.map((p) => (
                                <SelectItem key={p.id_personal} value={p.id_personal.toString()}>
                                  {p.nombre_completo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Cargo</Label>
                          <Select
                            value={operador.cargo_coccion_id_cargo_coccion?.toString() || ""}
                            onValueChange={(value) =>
                              handleOperadorChange(index, "cargo_coccion_id_cargo_coccion", Number(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              {cargos.map((c) => (
                                <SelectItem key={c.id_cargo_coccion} value={c.id_cargo_coccion.toString()}>
                                  {c.nombre_cargo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOperador(index)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoccionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCoccion}>Guardar</Button>
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

    </div>
  )
}

