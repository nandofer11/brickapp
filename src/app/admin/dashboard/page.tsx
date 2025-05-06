"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils"

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

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      fecha_inicio: undefined,
      fecha_fin: undefined,
    },
  });

  const fetchSemanasLaborales = async () => {
    try {
      const response = await fetch('/api/semana_laboral');
      const data = await response.json();
      setSemanasLaborales(data);
    } catch (error) {
      console.error('Error al cargar semanas laborales:', error);
    }
  };

  const handleEdit = (semana: SemanaLaboral) => {
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
    // Aquí iría la lógica para guardar/actualizar
    console.log(values);
    setIsModalOpen(false);
    setIsEditing(false);
    form.reset();
    await fetchSemanasLaborales();
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
              {semanasLaborales.map((semana) => (
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
