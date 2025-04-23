"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { format, parseISO, differenceInDays, isMonday, isSaturday, isSunday } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

// Define the form schema with basic required validations only
const formSchema = z
  .object({
    startDate: z.date({
      required_error: "La fecha de inicio es requerida.",
    }),
    endDate: z.date({
      required_error: "La fecha de fin es requerida.",
    }),
    id_semana_trabajo: z.number().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  })

type WorkWeek = {
  id_semana_trabajo: number
  fecha_inicio: string
  fecha_fin: string
  estado: number
  id_empresa: number
}

export function WorkWeekModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: session } = useSession()
  const id_empresa = Number(session?.user?.id_empresa) || 0

  const [semanas, setSemanas] = useState<WorkWeek[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
      id_semana_trabajo: undefined,
    },
  })

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchSemanas()
    }
  }, [open])

  // Clean form data when modal closes
  useEffect(() => {
    if (!open) {
      form.reset() // Reset the form to default values
      setCurrentPage(1) // Reset to first page when modal closes
      setEditMode(false) // Reset edit mode
      setValidationError(null) // Clear validation errors
    }
  }, [open, form])

  const fetchSemanas = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/semana_laboral")
      const data = await res.json()

      // Sort data by fecha_inicio in descending order
      const sortedData = data.sort((a: WorkWeek, b: WorkWeek) => {
        return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
      })

      setSemanas(sortedData)
    } catch (error) {
      console.error("Error fetching semanas:", error)
      toast.error("No se pudieron cargar las semanas laborales")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (week: WorkWeek) => {
    setEditMode(true)
    form.setValue("startDate", parseISO(week.fecha_inicio))
    form.setValue("endDate", parseISO(week.fecha_fin))
    form.setValue("id_semana_trabajo", week.id_semana_trabajo)
  }

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)

      const res = await fetch("/api/semana_laboral", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_semana_trabajo: deleteId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al eliminar la semana laboral")
      }

      toast.success("Semana laboral eliminada correctamente")
      setShowDeleteDialog(false)
      fetchSemanas()
    } catch (error) {
      console.error("Error deleting semana:", error)
      toast.error("No se pudo eliminar la semana laboral")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  // Validate the week before submission
  const validateWeek = (values: z.infer<typeof formSchema>): string | null => {
    // Check if start date is a Monday
    if (!isMonday(values.startDate)) {
      return "La fecha de inicio debe ser un lunes"
    }

    // Check if end date is a Saturday or Sunday
    if (!isSaturday(values.endDate) && !isSunday(values.endDate)) {
      return "La fecha de fin debe ser un sábado o domingo"
    }

    // Check if the week is 6-7 days long
    const days = differenceInDays(values.endDate, values.startDate) + 1
    if (days < 6 || days > 7) {
      return "La semana debe tener entre 6 y 7 días"
    }

    // Check if there's an active week (only for new weeks)
    if (!editMode) {
      const activeWeek = semanas.find((week) => week.estado === 1)
      if (activeWeek) {
        return "No se puede iniciar una nueva semana mientras haya una semana activa. Cierre la semana activa primero."
      }
    }

    return null
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      setValidationError(null)

      // Validate the week
      const error = validateWeek(values)
      if (error) {
        setValidationError(error)
        setShowErrorDialog(true)
        return
      }

      // Format dates for API
      const formattedStartDate = format(values.startDate, "yyyy-MM-dd")
      const formattedEndDate = format(values.endDate, "yyyy-MM-dd")

      // Prepare data for API
      const data = {
        fecha_inicio: formattedStartDate,
        fecha_fin: formattedEndDate,
        estado: 1, // Active by default
        id_empresa: id_empresa,
        ...(editMode && { id_semana_trabajo: values.id_semana_trabajo }),
      }

      // Determine if it's a POST or PUT request
      const method = editMode ? "PUT" : "POST"

      const res = await fetch("/api/semana_laboral", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al guardar la semana laboral")
      }

      toast.success(editMode ? "Semana laboral actualizada correctamente" : "Semana laboral iniciada correctamente")

      // Reset form and fetch updated data
      form.reset()
      setEditMode(false)
      fetchSemanas()
    } catch (error) {
      console.error("Error submitting form:", error)
      if (error instanceof Error) {
        setValidationError(error.message)
        setShowErrorDialog(true)
      } else {
        setValidationError("Error al guardar la semana laboral")
        setShowErrorDialog(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = semanas.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(semanas.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Semana Laboral</DialogTitle>
            <DialogDescription>
              {editMode
                ? "Edite la fecha de fin de la semana laboral."
                : "Ingrese las fechas de inicio y fin de la semana laboral."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de inicio (Lunes)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  editMode && "opacity-50 cursor-not-allowed",
                                )}
                                disabled={editMode}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de fin (Sábado o Domingo)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editMode ? "Actualizando..." : "Iniciando..."}
                    </>
                  ) : editMode ? (
                    "Actualizar"
                  ) : (
                    "Iniciar"
                  )}
                </Button>

                {editMode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-2"
                    onClick={() => {
                      setEditMode(false)
                      form.reset()
                      setValidationError(null)
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </form>
            </Form>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha de inicio</TableHead>
                    <TableHead>Fecha de fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <div className="flex justify-center items-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Cargando datos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : semanas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No hay registros. Agregue una semana laboral.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((week) => (
                      <TableRow key={week.id_semana_trabajo}>
                        <TableCell>{week.id_semana_trabajo}</TableCell>
                        <TableCell>{format(parseISO(week.fecha_inicio), "dd/MM/yyyy", { locale: es })}</TableCell>
                        <TableCell>{format(parseISO(week.fecha_fin), "dd/MM/yyyy", { locale: es })}</TableCell>
                        <TableCell>
                          <Badge
                            variant={week.estado === 1 ? "default" : "destructive"}
                            className={cn(
                              "px-2 py-1",
                              week.estado === 1
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100",
                            )}
                          >
                            {week.estado === 1 ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {week.estado === 1 && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(week)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => confirmDelete(week.id_semana_trabajo)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {!isLoading && semanas.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{" "}
                    <span className="font-medium">{Math.min(indexOfLastItem, semanas.length)}</span> de{" "}
                    <span className="font-medium">{semanas.length}</span> registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Página anterior</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <Button
                          key={number}
                          variant={currentPage === number ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(number)}
                          className="h-8 w-8 p-0"
                        >
                          {number}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Página siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{validationError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar esta semana laboral? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

