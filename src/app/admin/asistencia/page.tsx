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
  id_semana_trabajo: number
  fecha_inicio: string
  fecha_fin: string
  estado: number
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
        setSelectedSemana(semanaAbierta.id_semana_trabajo)
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

  // Actualiza la función handleEditAsistencia para guardar también el id_asistencia
  const handleEditAsistencia = async (fecha: string) => {
    const fechaCorrecta = new Date(fecha + "T00:00:00-05:00").toISOString().split("T")[0]
    setSelectedDate(fechaCorrecta)
    setModoEdicion(true)
    setModalOpen(true)

    try {
      const response = await fetch(`/api/asistencia?fecha=${fechaCorrecta}&id_semana_trabajo=${selectedSemana}`)

      if (!response.ok) throw new Error("Error al obtener asistencia")

      const asistenciaData = await response.json()
      const asistenciaSeleccionada: Record<number, { estado: "A" | "I" | "M"; id_asistencia: number }> = {}

      asistenciaData.forEach((a: any) => {
        asistenciaSeleccionada[a.id_personal] = {
          estado: a.estado as "A" | "I" | "M",
          id_asistencia: a.id_asistencia,
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

    const fechaAsistencia = selectedDate || new Date().toISOString().split("T")[0]

    // Construye los datos de asistencia según el modo (edición o creación)
    const asistenciaData = Object.entries(selectedAsistencia).map(([id_personal, datos]) => {
      const baseData = {
        id_personal: Number(id_personal),
        id_semana_trabajo: selectedSemana,
        fecha: fechaAsistencia,
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

  const getDaysOfWeek = (start: string, end: string) => {
    const startDate = new Date(start + "T00:00:00-05:00")
    const endDate = new Date(end + "T00:00:00-05:00")
    const days: string[] = []

    while (startDate <= endDate) {
      const day = startDate.getUTCDate().toString().padStart(2, "0")
      const month = (startDate.getUTCMonth() + 1).toString().padStart(2, "0")
      const year = startDate.getUTCFullYear()
      days.push(`${year}-${month}-${day}`)
      startDate.setUTCDate(startDate.getUTCDate() + 1)
    }
    return days
  }

  const selectedWeek = semanas.find((s) => s.id_semana_trabajo === selectedSemana)
  const daysOfWeek = selectedWeek ? getDaysOfWeek(selectedWeek.fecha_inicio, selectedWeek.fecha_fin) : []

  const formatDate = (date: string, includeYear = true) => {
    const parsedDate = new Date(date + "T00:00:00-05:00")
    const day = parsedDate.getUTCDate().toString().padStart(2, "0")
    const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, "0")
    const year = parsedDate.getUTCFullYear()
    return includeYear ? `${day}-${month}-${year}` : `${day}-${month}`
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
    const parsedDate = new Date(date + "T00:00:00-05:00")
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    return dayNames[parsedDate.getDay()]
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold mb-6">Asistencia del Personal</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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
                {semanas.map((semana) => (
                  <SelectItem key={semana.id_semana_trabajo} value={semana.id_semana_trabajo.toString()}>
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
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-xs text-muted-foreground">{getDayName(dia)}</span>
                          <span>{formatDate(dia, true)}</span>
                        </div>
                        {asistencia.some((a) => a.fecha.endsWith(dia)) && (
                          <Button
                            variant="outline" size="icon"
                            onClick={() => handleEditAsistencia(dia)}
                            className="my-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        )}
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
                  let totalAsistencias = 0
                  let totalFaltas = 0
                  let totalMediosDias = 0

                  const asistenciaCeldas = daysOfWeek.map((dia) => {
                    const estado =
                      asistencia.find((a) => a.id_personal === p.id_personal && a.fecha.endsWith(dia))?.estado || "-"

                    if (estado === "A") totalAsistencias++
                    if (estado === "I") totalFaltas++
                    if (estado === "M") totalMediosDias++

                    return (
                      <TableCell key={dia} className="text-center">
                        {getAsistenciaIcon(estado)}
                      </TableCell>
                    )
                  })

                  return (
                    <TableRow key={p.id_personal}>
                      <TableCell className="font-medium">{p.nombre_completo}</TableCell>
                      {asistenciaCeldas}
                      <TableCell className="text-center font-bold bg-primary/10">{totalAsistencias}</TableCell>
                      <TableCell className="text-center font-bold">{totalFaltas}</TableCell>
                      <TableCell className="text-center font-bold">{totalMediosDias}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex">

            <Card className="">
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
        </>
      )}

      {/* Modal de Registro de Asistencia */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{modoEdicion ? "Actualizar Asistencia" : "Registro de Asistencia"}</DialogTitle>
            <DialogDescription>
              {modoEdicion
                ? "Modifique los estados de asistencia para la fecha seleccionada"
                : "Seleccione la semana, fecha y registre la asistencia del personal"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Fila con Selección de Semana y Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semana-modal">Seleccionar Semana:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedSemana?.toString() || ""}
                    onValueChange={(value) => setSelectedSemana(Number(value))}
                    disabled={modoEdicion}
                  >
                    <SelectTrigger id="semana-modal" className="flex-1">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {semanas
                        .filter((s) => s.estado === 1)
                        .map((semana) => (
                          <SelectItem key={semana.id_semana_trabajo} value={semana.id_semana_trabajo.toString()}>
                            {formatDate(semana.fecha_inicio)} al {formatDate(semana.fecha_fin)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" onClick={() => router.push("/admin/dashboard")} disabled={modoEdicion}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Seleccionar Fecha:</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split("T")[0]}
                  disabled={modoEdicion}
                />
              </div>
            </div>

            {/* Radio Buttons para marcar todos */}
            <div className="space-y-2">
              <Label>Marcar para todos:</Label>
              <RadioGroup
                value={selectAll || ""}
                onValueChange={(value) => handleMarkAll(value as "A" | "I" | "M")}
                className="flex space-x-4"
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

            {/* Tabla de Personal con Selects */}
            <div className="border rounded-md">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted/50">Empleado</TableHead>
                      <TableHead className="bg-muted/50">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personal.map((p) => (
                      <TableRow key={p.id_personal}>
                        <TableCell>{p.nombre_completo}</TableCell>
                        <TableCell>
                          {/* Actualiza el componente Select en la tabla de personal */}
                          <Select
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
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">
                                <span className="flex items-center">
                                  <Check className="h-4 w-4 text-green-600 mr-2" /> Asistencia
                                </span>
                              </SelectItem>
                              <SelectItem value="I">
                                <span className="flex items-center">
                                  <X className="h-4 w-4 text-red-600 mr-2" /> Inasistencia
                                </span>
                              </SelectItem>
                              <SelectItem value="M">
                                <span className="flex items-center">
                                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" /> Medio Día
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button onClick={handleRegisterAsistencia} disabled={isSubmitting}>
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

