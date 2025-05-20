"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Edit, Check, X, AlertCircle, Plus, Loader2, NotebookPen, Calendar1 } from "lucide-react"

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

interface Personal {
  id_personal: number
  nombre_completo: string
  estado: number
}

interface Semana {
  id_semana_laboral: number; // Cambiado de id_semana_trabajo
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

export default function AsistenciaPage() {
  const router = useRouter()

  const [personal, setPersonal] = useState<Personal[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [asistencia, setAsistencia] = useState<Asistencia[]>([])
  const [selectedSemana, setSelectedSemana] = useState<number | null>(null)
  // Modifica el estado selectedAsistencia para almacenar también el id_asistencia
  const [selectedAsistencia, setSelectedAsistencia] = useState<{
    [key: number]: { estado: string; id_asistencia?: number }
  }>({})
  const [selectAll, setSelectAll] = useState<"A" | "I" | "M" | null>(null)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("es-PE", { timeZone: "America/Lima" }).split("/").reverse().join("-"),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)

  useEffect(() => {
    document.title = "Asistencia"
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    await Promise.all([fetchPersonal(), fetchSemanas(), fetchAsistencia()])
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
      setSemanas(data)

      const semanaAbierta = data.find((s: Semana) => s.estado === 1)
      if (semanaAbierta) {
        setSelectedSemana(semanaAbierta.id_semana_laboral) // Cambiado de id_semana_trabajo
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
      console.error('Error al obtener días de la semana:', error);
      return [];
    }
  }

  const selectedWeek = semanas.find((s) => s.id_semana_laboral === selectedSemana)
  const daysOfWeek = selectedWeek ? getDaysOfWeek(selectedWeek.fecha_inicio, selectedWeek.fecha_fin) : []

  // Modificar la función handleEditAsistencia
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

      // Inicializar todas las asistencias como vacías
      const asistenciaSeleccionada: Record<number, { estado: "A" | "I" | "M" | "-"; id_asistencia?: number }> = {}

      // Primero inicializar todos los trabajadores con estado "-"
      personal.forEach(p => {
        asistenciaSeleccionada[p.id_personal] = {
          estado: "-",
          id_asistencia: undefined
        }
      })

      // Luego actualizar solo los que tienen asistencia registrada
      asistenciaData.forEach((a: any) => {
        if (a.id_personal) {
          asistenciaSeleccionada[a.id_personal] = {
            estado: a.estado as "A" | "I" | "M",
            id_asistencia: a.id_asistencia
          }
        }
      })

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

    const fechaAsistenciaISO = new Date(selectedDate ?? new Date()).toISOString();


    // Construye los datos de asistencia según el modo (edición o creación)
    const asistenciaData = Object.entries(selectedAsistencia).map(([id_personal, datos]) => {
      const baseData = {
        id_personal: Number(id_personal),
        id_semana_laboral: selectedSemana, // Cambiado de id_semana_trabajo
        fecha: fechaAsistenciaISO,
        estado: datos.estado,
      }

      // Si estamos en modo edición y tenemos un id_asistencia, lo incluimos
      if (modoEdicion && datos.id_asistencia) {
        return {
          ...baseData,
          id_asistencia: datos.id_asistencia,
        }
      }

      return baseData
    })

    if (asistenciaData.length === 0) {
      toast.error("Seleccione al menos un trabajador con un estado de asistencia")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/asistencia", {
        method: modoEdicion ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(asistenciaData),
      })

      if (!response.ok) {
        throw new Error(modoEdicion ? "Error al actualizar la asistencia" : "Error al registrar la asistencia")
      }

      toast.success(modoEdicion ? "Asistencia actualizada correctamente" : "Asistencia guardada correctamente")
      fetchAsistencia()
      setModalOpen(false)
      resetModal()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Hubo un error al procesar la asistencia")
    } finally {
      setIsSubmitting(false)
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
    setSelectedDate(new Date().toLocaleDateString("es-PE", { timeZone: "America/Lima" }).split("/").reverse().join("-"))
    setSelectedAsistencia({})
    setModoEdicion(false)
    setSelectAll(null)
  }

  const handleOpenRegisterModal = () => {
    resetModal()
    setSelectedDate(new Date().toISOString().split("T")[0])
    setModalOpen(true)
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
                  .filter(semana => semana?.id_semana_laboral) // Filtrar semanas inválidas
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

        <Button onClick={handleOpenRegisterModal} className="w-full md:w-auto">
          <NotebookPen /> Registrar Asistencia
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      ) : (
        <>
        <div className="flex">
            <Card className="p-2 px-0">
              <CardContent className="flex gap-4">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-600 mr-2" /> Asistencia
                </div>
                <div className="flex items-center">
                  <X className="h-4 w-4 text-red-600 mr-2" /> Faltas
                </div>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" /> Medio Día
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

                  {daysOfWeek.map((dia) => (
                    <TableHead key={dia} className="bg-muted/50 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-xs text-muted-foreground">{getDayName(dia)}</span>
                          <span>{formatDate(dia, true)}</span>
                        </div>
                        {/* Botón editar por día */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditAsistencia(dia)}
                          className="my-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </div>
                    </TableHead>
                  ))}

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

                  const asistenciaCeldas = daysOfWeek.map((dia) => {
                    const estado = getAsistenciaForDate(p.id_personal, dia);

                    // Acumular totales
                    if (estado === "A") totalAsistencias++;
                    if (estado === "I") totalFaltas++;
                    if (estado === "M") totalMediosDias++;

                    return (
                      <TableCell key={dia} className="text-center">
                        {getAsistenciaIcon(estado)}
                      </TableCell>
                    );
                  });

                  return (
                    <TableRow key={p.id_personal}>
                      <TableCell className="font-medium">{p.nombre_completo}</TableCell>
                      {asistenciaCeldas}
                      <TableCell className="text-center font-bold bg-primary/10">
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
                    disabled={modoEdicion}
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
    </div>
  )
}

