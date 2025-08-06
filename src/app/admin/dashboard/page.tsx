"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar as CalendarIcon, Loader2, X as XIcon, CalendarX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils"


import { formatDate, formatDateForInput, formatDateWithDayName } from "@/utils/dateFormat";

import { toast } from "react-toastify";

interface SemanaLaboral {
  id_semana_laboral: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: number;
  id_empresa: number;
  created_at: string;
  updated_at: string;
}

const formSchema = z
  .object({
    fecha_inicio: z.date({ required_error: "La fecha de inicio es requerida" }),
    fecha_fin: z.date({ required_error: "La fecha de fin es requerida" }),
  })
  .refine((data) => data.fecha_fin >= data.fecha_inicio, {
    message: "La fecha de fin debe ser posterior a la de inicio.",
    path: ["fecha_fin"],
  });

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [semanasLaborales, setSemanasLaborales] = useState<SemanaLaboral[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSemanaId, setSelectedSemanaId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para manejo de cierre de semana
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [semanaToClose, setSemanaToClose] = useState<number | null>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      fecha_inicio: undefined,
      fecha_fin: undefined,
    },
  });

  useEffect(() => {
    document.title = "Dashboard"
    fetchSemanasLaborales();

  }, [isModalOpen]);

  const fetchSemanasLaborales = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/semana_laboral');
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }
      const data = await response.json();
      // Asegurarse de que data sea un array y obtener solo las últimas 4 semanas
      const semanasOrdenadas = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
        : [];

      // Tomar solo las últimas 4 semanas
      const ultimasCuatroSemanas = semanasOrdenadas.slice(0, 4);
      setSemanasLaborales(ultimasCuatroSemanas);
    } catch (error) {
      console.error('Error al cargar semanas laborales:', error);
      toast.error('Error al cargar semanas laborales');
      setSemanasLaborales([]); // Asegurarse de tener un array vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const isMonday = (date: Date) => {
    return date.getDay() === 1; // 1 represents Monday
  };

  const isWeekendDay = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  const getDaysDifference = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const getNextMonday = (date: Date) => {
    // Crear una nueva instancia de fecha para no modificar la original
    const nextMonday = new Date(date);

    // Resetear las horas, minutos, segundos para evitar problemas de comparación
    nextMonday.setHours(0, 0, 0, 0);

    const dayOfWeek = nextMonday.getDay(); // 0 es domingo, 6 es sábado

    // Calcular cuántos días debemos añadir para llegar al siguiente lunes
    // Si es domingo (0), sumamos 1 día
    // Si es sábado (6), sumamos 2 días
    // Para cualquier otro día, sumamos días hasta el siguiente lunes (8-dayOfWeek)
    let daysToAdd;

    if (dayOfWeek === 0) { // Domingo
      daysToAdd = 1;
    } else if (dayOfWeek === 6) { // Sábado
      daysToAdd = 2;
    } else { // Cualquier otro día
      daysToAdd = 8 - dayOfWeek;
    }

    nextMonday.setDate(nextMonday.getDate() + daysToAdd);

    console.log('Fecha original:', date.toISOString().split('T')[0]);
    console.log('Próximo lunes calculado:', nextMonday.toISOString().split('T')[0]);

    return nextMonday;
  };

  const validateNewWeek = async (startDate: Date) => {
    const response = await fetch('/api/semana_laboral');
    const semanas = await response.json();

    // Verificar si hay semana activa
    const activeSemana = semanas.find((s: SemanaLaboral) => s.estado === 1);
    if (activeSemana) {
      throw new Error("Ya existe una semana laboral activa");
    }

    // Ordenar las semanas por fecha de inicio (más reciente primero)
    const semanasOrdenadas = semanas.sort((a: SemanaLaboral, b: SemanaLaboral) => 
      new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    );

    // Verificar continuidad con última semana
    const lastSemana = semanasOrdenadas.length > 0 ? semanasOrdenadas[0] : null;
    if (lastSemana) {
      // Fecha fin de la última semana
      const lastEndDate = new Date(lastSemana.fecha_fin);
      lastEndDate.setHours(0, 0, 0, 0); // Resetear hora para comparación correcta

      // Calcular el siguiente lunes después de la fecha fin
      const expectedNextMonday = getNextMonday(lastEndDate);

      // Normalizar las fechas para comparación (solo año, mes, día)
      const expectedStr = expectedNextMonday.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];

      console.log('Fecha fin última semana:', lastEndDate.toISOString().split('T')[0]);
      console.log('Lunes siguiente esperado:', expectedStr);
      console.log('Fecha inicio proporcionada:', startDateStr);

      if (expectedStr !== startDateStr) {
        throw new Error(`La fecha de inicio debe ser el lunes siguiente a la última semana registrada (${expectedStr.split('-').reverse().join('/')})`);
      }
    }
  };

  const handleEdit = (semana: SemanaLaboral) => {
    setSelectedSemanaId(semana.id_semana_laboral);
    try {
      // Convertir las fechas string a objetos Date y ajustar la zona horaria
      const fechaInicio = new Date(semana.fecha_inicio);
      const fechaFin = new Date(semana.fecha_fin);

      // Crear nuevas fechas con la hora establecida a medianoche en la zona horaria local
      const fechaInicioLocal = new Date(
        fechaInicio.getUTCFullYear(),
        fechaInicio.getUTCMonth(),
        fechaInicio.getUTCDate()
      );

      const fechaFinLocal = new Date(
        fechaFin.getUTCFullYear(),
        fechaFin.getUTCMonth(),
        fechaFin.getUTCDate()
      );

      // Establecer las fechas en el formulario
      form.setValue('fecha_inicio', fechaInicioLocal, { shouldValidate: true });
      form.setValue('fecha_fin', fechaFinLocal, { shouldValidate: true });

      setIsEditing(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error al procesar las fechas:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { fecha_inicio, fecha_fin } = values;

      // Validar que ambas fechas existan
      if (!fecha_inicio) {
        toast.error("Debe seleccionar una fecha de inicio");
        return;
      }

      if (!fecha_fin) {
        toast.error("Debe seleccionar una fecha de fin");
        return;
      }


      // Asegurarse de que las fechas tengan hora 00:00:00
      const startDate = new Date(fecha_inicio);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(fecha_fin);
      endDate.setHours(0, 0, 0, 0);

      // Validar si existe una semana activa al crear una nueva
      if (!isEditing) {
        const semanasResponse = await fetch('/api/semana_laboral');
        const semanas = await semanasResponse.json();
        const semanasActivas = semanas.filter((s: SemanaLaboral) => s.estado === 1);

        if (semanasActivas.length > 0) {
          toast.error("No se puede crear una nueva semana mientras exista una activa. Por favor, cierre la semana actual.");
          return;
        }
      }

      // Validaciones comunes
      if (!isWeekendDay(fecha_fin)) {
        toast.error("La fecha fin debe ser sábado o domingo");
        return;
      }

      const daysDiff = getDaysDifference(fecha_inicio, fecha_fin);
      if (daysDiff < 6 || daysDiff > 7) {
        toast.error("La semana laboral debe tener entre 6 y 7 días");
        return;
      }
      if (!isEditing) {
        if (!isMonday(startDate)) {
          toast.error("La fecha de inicio debe ser lunes");
          return;
        }
        await validateNewWeek(startDate);
      }

      const endpoint = '/api/semana_laboral';
      const method = isEditing ? 'PUT' : 'POST';
      const body = {
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString(),
        estado: 1,
        ...(isEditing && { id_semana_laboral: selectedSemanaId })
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud');
      }

      toast.success(isEditing ? 'Semana actualizada exitosamente' : 'Semana creada exitosamente');
      // handleModalClose();
      await fetchSemanasLaborales();

    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la operación');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/semana_laboral?id=${selectedSemanaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la semana');
      }

      toast.success('Semana eliminada exitosamente');
      // setShowDeleteModal(false);
      await fetchSemanasLaborales();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la semana');
    }
  };

  const formatearFecha = (fecha: string) => {
    return formatDateWithDayName(fecha);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    form.reset();
  };



  // Función para cerrar una semana laboral
  const handleCerrarSemana = async (idSemana: number) => {
    setSemanaToClose(idSemana);
    setShowCloseModal(true);

  };

  const confirmCerrarSemana = async () => {
    try {
      if (!semanaToClose) return;

      const response = await fetch('/api/semana_laboral', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_semana_laboral: semanaToClose,
          estado: 0 // Actualizar estado a "cerrado"
        })
      });

      if (!response.ok) {
        throw new Error('Error al cerrar la semana');
      }

      toast.success('Semana laboral cerrada exitosamente');
      setShowCloseModal(false);
      await fetchSemanasLaborales();
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar la semana');
    }
  }

  const semanaActiva = semanasLaborales.find(semana => semana.estado === 1);

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex gap-4 justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
            <p className="text-muted-foreground">Gestione su semana laboral y vea los registros existentes.</p>
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsModalOpen(true)}>Semana Laboral</Button>
            </div>
          </div>

          <div className="min-w-[300px] max-w-sm rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">Semana Laboral</h3>

              {semanaActiva ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge
                      className={cn(
                        "px-2 py-1",
                        "bg-green-100 text-green-800 hover:bg-green-100"
                      )}
                    >
                      Activa
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fecha inicio:</span>
                    <span className="font-medium"> {formatearFecha(semanaActiva.fecha_inicio)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fecha fin:</span>
                    <span className="font-medium"> {formatearFecha(semanaActiva.fecha_fin)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="py-2 text-center text-muted-foreground">
                    No hay semana laboral activa.
                  </div>

                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="flex-1 rounded-xl bg-muted/50 p-6 md:min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          <p className="text-muted-foreground">Aquí se mostrará un resumen de su actividad reciente.</p>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>Semana Laboral</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite la fecha de fin de la semana laboral."
                : "Ingrese las fechas de inicio y fin de la semana laboral."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de inicio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={isEditing}>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                isEditing && "opacity-50 cursor-not-allowed"
                              )}
                              disabled={isEditing}
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
                        {!isEditing && (
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={es}
                            />
                          </PopoverContent>
                        )}
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de fin</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
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
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit">
                {isEditing ? "Actualizar" : "Guardar"}
              </Button>
            </form>
          </Form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : semanasLaborales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <span className="text-muted-foreground">
                      No hay registros de semanas laborales
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                semanasLaborales.map((semana) => (
                  <TableRow key={semana.id_semana_laboral}>
                    <TableCell>{semana.id_semana_laboral}</TableCell>
                    <TableCell>{formatearFecha(semana.fecha_inicio)}</TableCell>
                    <TableCell>{formatearFecha(semana.fecha_fin)}</TableCell>
                    <TableCell>
                      <Badge variant={semana.estado === 1 ? "default" : "destructive"}
                        className={cn(
                          "px-2 py-1",
                          semana.estado === 1
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100",
                        )}>
                        {semana.estado === 1 ? 'Activo' : 'Cerrada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0">
                        {semana.estado === 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(semana)}
                              title="Editar semana"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCerrarSemana(semana.id_semana_laboral)}
                              title="Cerrar semana"
                            >
                              <CalendarX className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSemanaId(semana.id_semana_laboral);
                                setShowDeleteModal(true);
                              }}
                              title="Eliminar semana"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar esta semana laboral?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cierre de semana</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea cerrar esta semana laboral?
              Una vez cerrada, no podrá realizar más cambios.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowCloseModal(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={confirmCerrarSemana}>
              Confirmar cierre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
