"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { PlusCircle, Pencil, Trash2, Check, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Personal {
  id_personal: number
  dni: string
  nombre_completo: string
  fecha_nacimiento: string
  ciudad: string
  direccion: string | null
  celular: string | null
  pago_diario_normal: number
  pago_diario_reducido: number | null
  fecha_ingreso: string
  estado: number
  id_empresa: number
}

export default function PersonalPage() {
  const { data: session } = useSession()
  const id_empresa = Number(session?.user?.id_empresa) || 0

  const [personalList, setPersonalList] = useState<Personal[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [currentPersonal, setCurrentPersonal] = useState<Partial<Personal> | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [filteredPersonal, setFilteredPersonal] = useState<Personal[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [validatingDni, setValidatingDni] = useState<boolean>(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 10
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredPersonal.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredPersonal.length / recordsPerPage)

  useEffect(() => {
    document.title = "Gestión de Personal"
    fetchPersonal()
  }, [])

  useEffect(() => {
    // Resetear a la primera página cuando cambia el filtro
    setCurrentPage(1)
  }, [searchTerm])

  const fetchPersonal = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/personal")
      const data = await res.json()
      setPersonalList(data)
      setFilteredPersonal(data)
    } catch (error) {
      toast.error("Error al obtener el listado de personal.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentPersonal) return

    // Validar que los campos requeridos no estén vacíos
    const requiredFields = [
      { field: "dni", message: "El DNI es obligatorio" },
      { field: "nombre_completo", message: "El nombre completo es obligatorio" },
      { field: "ciudad", message: "La ciudad es obligatoria" },
      { field: "fecha_nacimiento", message: "La fecha de nacimiento es obligatoria" },
      { field: "pago_diario_normal", message: "El pago diario normal es obligatorio" },
      { field: "fecha_ingreso", message: "La fecha de ingreso es obligatoria" },
      { field: "estado", message: "Debe seleccionar un estado" },
    ]

    for (const { field, message } of requiredFields) {
      const value = (currentPersonal as any)[field]

      if (value === undefined || value === null || value.toString().trim() === "") {
        toast.error("Error en la validación.")
        return
      }
    }

    // Validar DNI
    if (currentPersonal.dni?.length !== 8 || isNaN(Number(currentPersonal.dni))) {
      toast.error("El Dni debe tener 8 dígitos.")
      return
    }

    // Validar Celular
    if (currentPersonal.celular && (currentPersonal.celular.length !== 9 || isNaN(Number(currentPersonal.celular)))) {
      toast.error("El celular debe tener 9 dígitos numéricos.")
      return
    }

    try {
      const method = currentPersonal.id_personal ? "PUT" : "POST";

      // Formatear fechas al formato ISO-8601 con hora
      const formattedData = {
        ...currentPersonal,
        fecha_nacimiento: currentPersonal.fecha_nacimiento
          ? new Date(currentPersonal.fecha_nacimiento).toISOString()
          : null,
        fecha_ingreso: currentPersonal.fecha_ingreso
          ? new Date(currentPersonal.fecha_ingreso).toISOString()
          : null,
        pago_diario_reducido: currentPersonal.pago_diario_reducido || null,
        id_empresa: id_empresa,
      };

      console.log("Datos a enviar:", formattedData);

      const res = await fetch("/api/personal", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Error en la operación")
      }

      toast.success("Personal registrado con éxito.", {
        className: "bg-green-500 text-white", // Clase personalizada
      })
      setShowModal(false)
      fetchPersonal()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Error desconocido al guardar los datos.")
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/personal?id_personal=${deleteId}`, { method: "DELETE" })

      if (!res.ok) throw new Error("Error al eliminar")

      toast.success("Personal eliminado correctamente.")
      setShowConfirmModal(false)
      fetchPersonal()
    } catch (error) {
      toast.error("Error al eliminar el personal.")
      console.log("ELIMINAR PERSONAL: ", error)
    }
  }

  const validateDNI = async () => {
    if (!currentPersonal?.dni) {
      toast.error("Ingrese un DNI");
      setCurrentPersonal((prev) => ({ ...prev!, dni: ""}));
      return;
    }

    if (currentPersonal.dni.length !== 8 || isNaN(Number(currentPersonal.dni))) {
      toast.error("El DNI debe tener 8 dígitos numéricos.");
      setCurrentPersonal((prev) => ({ ...prev!, dni: "" }));
      return;
    }

    try {
      setValidatingDni(true);
      const res = await fetch("/api/validar-dni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: currentPersonal.dni , id_empresa: currentPersonal.id_empresa }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la validación del DNI");
      }

      const data = await res.json();

      if (data.nombres && data.apellido_paterno && data.apellido_materno) {
        const nombreCompleto = `${data.nombres} ${data.apellido_paterno} ${data.apellido_materno}`;
        setCurrentPersonal((prev) => ({ ...prev!, nombre_completo: nombreCompleto }));
        toast.success("DNI validado correctamente.");
      } else {
        toast.error("DNI no válido o no encontrado.");
        setCurrentPersonal((prev) => ({ ...prev!, dni: "" }));
      }
    } catch (error) {
      setCurrentPersonal((prev) => ({ ...prev!, dni: "" }));
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error desconocido al validar el DNI.");
      }
    } finally {
      setValidatingDni(false);
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase()
    setSearchTerm(term)

    if (!term) {
      setFilteredPersonal(personalList)
      return
    }

    const filtered = personalList.filter(
      (p) => p.dni.toLowerCase().includes(term) || p.nombre_completo.toLowerCase().includes(term),
    )
    setFilteredPersonal(filtered)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Gestión de Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => {
                  setCurrentPersonal({ id_empresa: id_empresa })
                  setShowModal(true)
                }}
                className="cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Personal
              </Button>

              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por DNI o Nombre"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Tabla de Personal */}
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Cargando datos...</span>
              </div>
            ) : filteredPersonal.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay registros.</div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DNI</TableHead>
                        <TableHead>Nombre completo</TableHead>
                        <TableHead>F. Nac.</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead>Pago Diario</TableHead>
                        <TableHead>Pago Red.</TableHead>
                        <TableHead>F. Ingreso</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRecords.map((p) => (
                        <TableRow key={p.id_personal}>
                          <TableCell>{p.dni}</TableCell>
                          <TableCell>{p.nombre_completo}</TableCell>
                          <TableCell>{formatDate(p.fecha_nacimiento)}</TableCell>
                          <TableCell>{p.ciudad}</TableCell>
                          <TableCell>{p.direccion ?? "N/A"}</TableCell>
                          <TableCell>{p.celular ?? "N/A"}</TableCell>
                          <TableCell>S/. {p.pago_diario_normal}</TableCell>
                          <TableCell>{p.pago_diario_reducido ? `S/. ${p.pago_diario_reducido}` : "-"}</TableCell>
                          <TableCell>{formatDate(p.fecha_ingreso)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={p.estado === 1 ? "default" : "destructive"}
                              className={p.estado === 1 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                            >
                              {p.estado === 1 ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setCurrentPersonal({
                                    ...p,
                                    fecha_nacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.split("T")[0] : "",
                                    fecha_ingreso: p.fecha_ingreso ? p.fecha_ingreso.split("T")[0] : "",
                                  });
                                  setShowModal(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteId(p.id_personal);
                                  setShowConfirmModal(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredPersonal.length)} de{" "}
                    {filteredPersonal.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Página anterior</span>
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Página siguiente</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Registro / Edición */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPersonal?.id_personal ? "Editar Personal" : "Registrar Personal"}</DialogTitle>
            <DialogDescription>Complete los datos del personal y presione guardar cuando termine.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <div className="flex gap-2">
                  <Input
                    id="dni"
                    maxLength={8}
                    value={currentPersonal?.dni ?? ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setCurrentPersonal({ ...currentPersonal!, dni: value })
                    }}
                  />
                  <Button onClick={validateDNI} disabled={validatingDni} className="whitespace-nowrap">
                    {validatingDni ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Validar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" value={currentPersonal?.nombre_completo ?? ""} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={currentPersonal?.ciudad ?? ""}
                  onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, ciudad: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={currentPersonal?.direccion ?? ""}
                  onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, direccion: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={currentPersonal?.fecha_nacimiento ?? ""}
                  onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, fecha_nacimiento: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  maxLength={9}
                  value={currentPersonal?.celular ?? ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setCurrentPersonal((prev) => ({ ...prev!, celular: value }))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pago_normal">Pago Diario Normal (S/.)</Label>
                <Input
                  id="pago_normal"
                  type="number"
                  value={currentPersonal?.pago_diario_normal ?? ""}
                  onChange={(e) =>
                    setCurrentPersonal((prev) => ({ ...prev!, pago_diario_normal: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pago_reducido">Pago Diario Reducido (S/.)</Label>
                <Input
                  id="pago_reducido"
                  type="number"
                  value={currentPersonal?.pago_diario_reducido ?? ""}
                  onChange={(e) =>
                    setCurrentPersonal((prev) => ({ ...prev!, pago_diario_reducido: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                <Input
                  id="fecha_ingreso"
                  type="date"
                  value={currentPersonal?.fecha_ingreso ?? ""}
                  onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, fecha_ingreso: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={currentPersonal?.estado?.toString() ?? ""}
                  onValueChange={(value) => setCurrentPersonal((prev) => ({ ...prev!, estado: Number(value) }))}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Activo</SelectItem>
                    <SelectItem value="0">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este personal? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

