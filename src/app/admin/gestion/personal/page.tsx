"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, PlusCircle, Pencil, Trash2, Check, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "react-toastify";

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

import { formatDateForInput } from '@/utils/dateFormat';


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
  ruc: string | null;
  razon_social: string | null;
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
  const [validatingRuc, setValidatingRuc] = useState<boolean>(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 10
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredPersonal.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredPersonal.length / recordsPerPage)

  const [selectedRow, setSelectedRow] = useState<number | null>(null);


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
    if (!currentPersonal) return;

    try {
      // Validar DNI
      if (!currentPersonal.dni?.trim()) {
        toast.error("El DNI es obligatorio");
        document.getElementById("dni")?.focus();
        return;
      }

      if (currentPersonal.dni.length !== 8 || isNaN(Number(currentPersonal.dni))) {
        toast.error("El DNI debe tener 8 dígitos numéricos");
        document.getElementById("dni")?.focus();
        return;
      }

      // Validar nombre completo
      if (!currentPersonal.nombre_completo?.trim()) {
        toast.error("El nombre completo es obligatorio");
        document.getElementById("nombre")?.focus();
        return;
      }

      // Si existe RUC, validar que sea correcto y coincida con el nombre
      if (currentPersonal.ruc?.trim()) {
        // Validar formato del RUC
        if (currentPersonal.ruc.length !== 11 || isNaN(Number(currentPersonal.ruc))) {
          toast.error("El RUC debe tener 11 dígitos numéricos");
          document.getElementById("ruc")?.focus();
          return;
        }

        // Validar que el RUC tenga razón social
        if (!currentPersonal.razon_social?.trim()) {
          toast.error("Debe validar el RUC ingresado");
          document.getElementById("ruc")?.focus();
          return;
        }

        // Validar que el nombre del DNI coincida con la razón social del RUC
        // const nombreDNI = currentPersonal.nombre_completo.trim().toLowerCase();
        // const nombreRUC = currentPersonal.razon_social.trim().toLowerCase();

        // if (nombreDNI !== nombreRUC) {
        //   toast.error("El nombre del DNI no coincide con la razón social del RUC");
        //   return;
        // }
      }

      // Validar ciudad
      if (!currentPersonal.ciudad?.trim()) {
        toast.error("La ciudad es obligatoria");
        document.getElementById("ciudad")?.focus();
        return;
      }

      // Validar pago diario
      if (!currentPersonal.pago_diario_normal || currentPersonal.pago_diario_normal <= 0) {
        toast.error("El pago diario normal debe ser mayor a 0");
        document.getElementById("pago_normal")?.focus();
        return;
      }

      // Validar fechas
      if (!currentPersonal.fecha_nacimiento) {
        toast.error("La fecha de nacimiento es obligatoria");
        document.getElementById("fecha_nacimiento")?.focus();
        return;
      }

      if (!currentPersonal.fecha_ingreso) {
        toast.error("La fecha de ingreso es obligatoria");
        document.getElementById("fecha_ingreso")?.focus();
        return;
      }

      // Validar estado
      if (currentPersonal.estado === undefined || currentPersonal.estado === null) {
        toast.error("El estado es obligatorio");
        document.getElementById("estado")?.focus();
        return;
      }

      const method = currentPersonal.id_personal ? "PUT" : "POST";

      // Verificar DNI duplicado solo para nuevos registros
      if (method === 'POST') {
        const existingPersonal = personalList.find(p => p.dni === currentPersonal.dni);
        if (existingPersonal) {
          toast.error("Ya existe un personal registrado con este DNI");
          return;
        }
      }

      const formattedData = {
        ...currentPersonal,
        fecha_nacimiento: currentPersonal.fecha_nacimiento
          ? new Date(currentPersonal.fecha_nacimiento + 'T00:00:00').toISOString()
          : null,
        fecha_ingreso: currentPersonal.fecha_ingreso
          ? new Date(currentPersonal.fecha_ingreso + 'T00:00:00').toISOString()
          : null,
        pago_diario_reducido: currentPersonal.pago_diario_reducido || null,
        id_empresa: id_empresa,
      };

      const res = await fetch("/api/personal", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la operación");
      }

      toast.success(
        currentPersonal.id_personal
          ? "Personal actualizado correctamente"
          : "Personal registrado correctamente"
      );

      setShowModal(false);
      await fetchPersonal();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al guardar los datos");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/personal?id_personal=${deleteId}`, { method: "DELETE" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al eliminar");
      }

      toast.success("Personal eliminado correctamente.");
      setShowConfirmModal(false);
      fetchPersonal();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al eliminar el personal.");
      }
      setShowConfirmModal(false);
      console.log("ELIMINAR PERSONAL: ", error);
    }
  };

  const validateDNI = async () => {
    if (!currentPersonal?.dni) {
      toast.error("Ingrese un DNI");
      setCurrentPersonal((prev) => ({ ...prev!, dni: "" }));
      return;
    }

    if (currentPersonal.dni.length !== 8 || isNaN(Number(currentPersonal.dni))) {
      toast.error("El DNI debe tener 8 dígitos numéricos.");
      setCurrentPersonal((prev) => ({ ...prev!, dni: "" }));
      return;
    }

    try {
      setValidatingDni(true);
      const res = await fetch("/api/validar-identidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "personal", // <- el modelo al que pertenece
          numero: currentPersonal.dni,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la validación del DNI");
      }

      const data = await res.json();

      if (data.nombres && data.apellido_paterno && data.apellido_materno) {
        const nombreCompleto = ` ${data.nombres} ${data.apellido_paterno} ${data.apellido_materno} `;
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
        toast.error("Error desconocido.");
      }
    } finally {
      setValidatingDni(false);
    }
  }

  const validateRUC = async () => {
    if (!currentPersonal?.ruc) {
      toast.error("Ingrese un RUC");
      setCurrentPersonal((prev) => ({ ...prev!, ruc: "" }));
      return;
    }

    if (currentPersonal.ruc.length !== 11 || isNaN(Number(currentPersonal.ruc))) {
      toast.error("El RUC debe tener 11 dígitos numéricos.");
      setCurrentPersonal((prev) => ({ ...prev!, ruc: "" }));
      return;
    }

    try {
      const res = await fetch("/api/validar-identidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "personal", // <- el modelo al que pertenece el RUC
          numero: currentPersonal.ruc,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en la validación del RUC");
      }

      const data = await res.json();

      if (data.razon_social) {
        setCurrentPersonal((prev) => ({
          ...prev!,
          razon_social: data.razon_social,
        }));
        toast.success("RUC validado correctamente.");
      } else {
        toast.error("RUC no válido o no encontrado.");
        setCurrentPersonal((prev) => ({ ...prev!, ruc: "" }));
      }
    } catch (error) {
      setCurrentPersonal((prev) => ({ ...prev!, ruc: "" }));
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error desconocido al validar el RUC.");
      }
    }
  };

  //Llimpiar campos del formulario 
  const handleClear = () => {
    setCurrentPersonal({
      id_empresa: id_empresa,
      dni: "",
      nombre_completo: "",
      fecha_nacimiento: "",
      ciudad: "",
      direccion: "",
      celular: "",
      pago_diario_normal: 0,
      pago_diario_reducido: 0,
      fecha_ingreso: "",
      estado: 1,
      ruc: "",
      razon_social: ""
    })
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
      const date = new Date(dateString);
      // Ajustar a la zona horaria local
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return dateString;
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
          <p className="text-sm text-muted-foreground">
            Administre el personal de la empresa.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <Button
                onClick={() => {
                  setCurrentPersonal({ id_empresa: id_empresa })
                  setShowModal(true)
                }}
                className="self-start md:self-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Personal
              </Button>

              <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2 flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-medium">
                  Personal Activo: {personalList.filter(p => p.estado === 1).length}
                </span>
              </div>

              <div className="relative w-full md:w-[350px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por DNI o Nombre"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-8 w-full"
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
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24 ">DNI</TableHead>
                          <TableHead className="w-24 ">RUC</TableHead>
                          <TableHead className="w-48 ">Nombre completo</TableHead>
                          <TableHead className="w-28 ">Ciudad</TableHead>
                          <TableHead className="w-40 ">Dirección</TableHead>
                          <TableHead className="w-28 ">Celular</TableHead>
                          <TableHead className="w-28 ">Pago Diario</TableHead>
                          <TableHead className="w-28 ">F. Ingreso</TableHead>
                          <TableHead className="w-24 ">Estado</TableHead>
                          <TableHead className="w-24 text-right ">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRecords.map((p) => (
                          <TableRow
                            key={p.id_personal}
                            className={`cursor-pointer transition-colors ${selectedRow === p.id_personal
                              ? "bg-primary/10 hover:bg-primary/15"
                              : "hover:bg-muted/50"
                              }`}
                            onClick={() => setSelectedRow(p.id_personal)}
                          >
                            <TableCell>{p.dni}</TableCell>
                            <TableCell>{p.ruc || "-"}</TableCell>
                            <TableCell>{p.nombre_completo}</TableCell>
                            <TableCell>{p.ciudad}</TableCell>
                            <TableCell>{p.direccion || "-"}</TableCell>
                            <TableCell>{p.celular || "-"}</TableCell>
                            <TableCell>S/. {p.pago_diario_normal}</TableCell>
                            <TableCell>{formatDate(p.fecha_ingreso)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={p.estado === 1 ? "default" : "secondary"}
                                className={p.estado === 1 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                              >
                                {p.estado === 1 ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation(); // Previene que se seleccione la fila al hacer clic en el botón

                                  // Formatear las fechas al cargar los datos para edición
                                  const formattedData = {
                                    ...p,
                                    fecha_nacimiento: p.fecha_nacimiento ? formatDateForInput(p.fecha_nacimiento) : "",
                                    fecha_ingreso: p.fecha_ingreso ? formatDateForInput(p.fecha_ingreso) : "",
                                  };

                                  setCurrentPersonal(formattedData);
                                  setShowModal(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation(); // Previene que se seleccione la fila al hacer clic en el botón
                                  setDeleteId(p.id_personal);
                                  setShowConfirmModal(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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

          <div className="grid gap-3 py-3">
            {/* Sección DNI y RUC */}
            <div className="flex flex-col space-y-3">
              {/* Campo DNI y Nombre */}
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <div className="flex gap-2">
                  <div className="flex w-[200px] gap-2">
                    <Input
                      id="dni"
                      className="w-full"
                      maxLength={8}
                      value={currentPersonal?.dni ?? ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        setCurrentPersonal({ ...currentPersonal!, dni: value })
                      }}
                      disabled={!!currentPersonal?.id_personal}
                    />
                    <Button
                      onClick={validateDNI}
                      disabled={validatingDni || !!currentPersonal?.id_personal}
                      size="icon"
                      className=""
                    >
                      {validatingDni ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="nombre"
                    className="flex-1"
                    value={currentPersonal?.nombre_completo ?? ""}
                    disabled
                    placeholder="Nombre completo"
                  />
                </div>
              </div>

              {/* Campo RUC y Razón Social */}
              <div className="space-y-2">
                <Label htmlFor="ruc">RUC</Label>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex w-full md:w-[200px] gap-2">
                    <Input
                      id="ruc"
                      className="w-full"
                      maxLength={11}
                      value={currentPersonal?.ruc ?? ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        setCurrentPersonal({ ...currentPersonal!, ruc: value })
                      }}
                      disabled={!!currentPersonal?.id_personal && !!currentPersonal?.ruc}
                    />
                    <Button
                      onClick={validateRUC}
                      size="icon"
                      disabled={validatingRuc || (!!currentPersonal?.id_personal && !!currentPersonal?.ruc)}
                      className=""
                    >
                      {validatingRuc ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="razon_social"
                    className="flex-1"
                    value={currentPersonal?.razon_social ?? ""}
                    disabled
                    placeholder="Razón social"
                  />
                </div>
              </div>
            </div>

            {/* Campos del formulario en dos columnas */}
            <div className="flex flex-col space-y-3">
              {/* Fila: Ciudad y Dirección */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={currentPersonal?.ciudad ?? ""}
                    onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, ciudad: e.target.value }))}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={currentPersonal?.direccion ?? ""}
                    onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, direccion: e.target.value }))}
                  />
                </div>
              </div>

              {/* Fila: Fecha Nacimiento y Celular */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={currentPersonal?.fecha_nacimiento ?? ""}
                    onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, fecha_nacimiento: e.target.value }))}
                  />
                </div>
                <div className="flex-1 space-y-2">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pago Diario Normal */}
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

                {/* Fecha de Ingreso */}
                <div className="space-y-2">
                  <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                  <Input
                    id="fecha_ingreso"
                    type="date"
                    value={currentPersonal?.fecha_ingreso ?? ""}
                    onChange={(e) => setCurrentPersonal((prev) => ({ ...prev!, fecha_ingreso: e.target.value }))}
                  />
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={currentPersonal?.estado?.toString() ?? ""}
                    onValueChange={(value) => setCurrentPersonal((prev) => ({ ...prev!, estado: Number(value) }))}>
                    <SelectTrigger id="estado" className="w-full h-10">
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

          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={!!currentPersonal?.id_personal} // Deshabilitar en modo edición
            >
              Limpiar
            </Button>

            <Button onClick={handleSave}>
              {currentPersonal?.id_personal ? "Actualizar" : "Guardar"}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
       <AlertDialogContent>
  <AlertDialogHeader>
    <div className="flex flex-col items-center justify-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
      <AlertDialogTitle className="text-xl font-semibold">Confirmar Eliminación</AlertDialogTitle>
    </div>
  </AlertDialogHeader>
  
  {/* No usar <p> dentro de <AlertDialogDescription> que ya es un <p> */}
  <AlertDialogDescription className="text-center text-base">
    ¿Está seguro que desea eliminar este registro?
    <span className="block text-sm text-muted-foreground mt-1">Esta acción no se puede deshacer.</span>
  </AlertDialogDescription>
  
  <AlertDialogFooter className="flex justify-center gap-2 mt-6">
    <AlertDialogCancel>Cancelar</AlertDialogCancel>
    <AlertDialogAction
      onClick={handleDelete}
      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
    >
      Eliminar
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

