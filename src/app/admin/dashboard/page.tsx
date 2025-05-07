"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils"

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

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      fecha_inicio: undefined,
      fecha_fin: undefined,
    },
  });

  const fetchSemanasLaborales = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/semana_laboral');
      const data = await response.json();
      setSemanasLaborales(data);
    } catch (error) {
      console.error('Error al cargar semanas laborales:', error);
      toast.error('Error al cargar semanas laborales');
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
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + (8 - date.getDay()));
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

    // Verificar continuidad con última semana
    const lastSemana = semanas[semanas.length - 1];
    if (lastSemana) {
      const lastEndDate = new Date(lastSemana.fecha_fin);
      const expectedNextMonday = getNextMonday(lastEndDate);
      if (startDate.getTime() !== expectedNextMonday.getTime()) {
        throw new Error("La fecha de inicio debe ser el lunes siguiente a la última semana registrada");
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
        if (!isMonday(fecha_inicio)) {
          toast.error("La fecha de inicio debe ser lunes");
          return;
        }
        await validateNewWeek(fecha_inicio);
      }

      const endpoint = '/api/semana_laboral';
      const method = isEditing ? 'PUT' : 'POST';
      const body = {
        fecha_inicio: fecha_inicio.toISOString(),
        fecha_fin: fecha_fin.toISOString(),
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
      handleModalClose();
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
      setShowDeleteModal(false);
      await fetchSemanasLaborales();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la semana');
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toISOString().split('T')[0].split('-').reverse().join('/');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    form.reset();
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchSemanasLaborales();
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
          <p className="text-muted-foreground">Gestione su semana laboral y vea los registros existentes.</p>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsModalOpen(true)}>Semana Laboral</Button>
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
        <DialogContent className="max-w-4xl">
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
                      <div className="flex gap-2">
                        {semana.estado === 1 && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(semana)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedSemanaId(semana.id_semana_laboral);
                                setShowDeleteModal(true);
                              }}
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
    </>
  );
}
