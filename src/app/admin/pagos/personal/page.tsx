"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PlusCircle, Loader2, DollarSign, ClipboardList, Edit, Trash2, AlertTriangle } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateFormat";

interface SemanaLaboral {
  id_semana_laboral: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: number;
}

interface Personal {
  id_personal: number;
  dni: string;
  ruc: string | null;
  nombre_completo: string;
  fecha_nacimiento: string;
  ciudad: string;
  direccion: string | null;
  celular: string | null;
  pago_diario_normal: number;
  pago_diario_reducido: number | null;
  fecha_ingreso: string;
  estado: number;
  id_empresa: number;
  created_at: string;
  updated_at: string;
}

interface AdelantoPersonal {
  id_adelanto_pago?: number;
  id_personal: number;
  id_semana_laboral: number;
  fecha: string;
  monto: number;
  comentario: string;
  estado: "Pendiente" | "Cancelado";
}

interface TareaExtra {
  id_tarea_extra?: number;
  id_personal: number;
  fecha: string;
  descripcion: string;
  monto: number;
}

interface ResumenPago {
  id_personal: number;
  nombre_completo: string;
  dias_completos: number;
  medios_dias: number;
  total_asistencia: number;
  total_tareas_extra: number;
  total_coccion: number;
  total_adelantos: number;
  total_descuentos: number;
  total_final: number;
  estado_pago: "Falta Pagar" | "Pagado";
}

interface Asistencia {
  id_personal: number;
  dias_completos: number;
  medios_dias: number;
}

export default function PagoPersonalPage() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [resumenPagos, setResumenPagos] = useState<ResumenPago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [semanasLaboral, setSemanasLaborales] = useState<SemanaLaboral[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>("");

  // Estados para el modal de adelanto
  const [adelantoModalOpen, setAdelantoModalOpen] = useState(false);
  const [adelantoData, setAdelantoData] = useState<Partial<AdelantoPersonal>>({
    fecha: new Date().toISOString().split('T')[0],
  });

  // Estados para el modal de tarea extra
  const [tareaModalOpen, setTareaModalOpen] = useState(false);
  const [tareaData, setTareaData] = useState<Partial<TareaExtra>>({
    fecha: new Date().toISOString().split('T')[0],
  });

  const [adelantos, setAdelantos] = useState<AdelantoPersonal[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [adelantoToDelete, setAdelantoToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchPersonal();
    fetchSemanasLaborales();
  }, []);

  //Función para cargar las semanas laborales
  const fetchSemanasLaborales = async () => {
    try {
      const response = await fetch("/api/semana_laboral?estado=1");
      const data = await response.json();
      setSemanasLaborales(data);

      // Seleccionar automáticamente la semana con estado 1
      const semanaActiva = data.find((s: SemanaLaboral) => s.estado === 1);
      if (semanaActiva) {
        setSemanaSeleccionada(semanaActiva.id_semana_laboral.toString());
      }
    } catch (error) {
      console.error("Error al cargar semanas laborales:", error);
      toast.error("Error al cargar semanas laborales");
    }
  };

  // Modificar la función fetchAsistenciaSemana
  const fetchAsistenciaSemana = async (idSemana: string) => {
    if (!idSemana) return;

    try {
      const response = await fetch("/api/asistencia");
      const asistencias = await response.json();

      // Filtrar asistencias por semana seleccionada
      const asistenciasSemana = asistencias.filter((a: any) =>
        a.id_semana_laboral.toString() === idSemana
      );

      // Procesar resumen por persona
      setResumenPagos(prev => prev.map(resumen => {
        // Filtrar asistencias del trabajador
        const asistenciasPersonal = asistenciasSemana.filter((a: any) =>
          a.id_personal === resumen.id_personal
        );

        // Contar días
        const dias_completos = asistenciasPersonal.filter((a: any) => a.estado === "A").length;
        const medios_dias = asistenciasPersonal.filter((a: any) => a.estado === "M").length;

        // Calcular pago por asistencia
        const personalObj = personal.find(p => p.id_personal === resumen.id_personal);
        const pagoDiarioNormal = personalObj ? personalObj.pago_diario_normal : 0;
        const totalAsistencia = (dias_completos * pagoDiarioNormal) +
          (medios_dias * (pagoDiarioNormal / 2));

        return {
          ...resumen,
          dias_completos,
          medios_dias,
          total_asistencia: totalAsistencia
        };
      }));

    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      toast.error("Error al cargar las asistencias");
    }
  };

  const fetchPersonal = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/personal");
      const data = await response.json();

      // Filtrar solo personal activo
      const personalActivo = data.filter((p: Personal) => p.estado === 1);
      setPersonal(personalActivo);

      // Crear el resumen de pagos basado en el personal activo
      const resumen: ResumenPago[] = personalActivo.map((p: Personal): ResumenPago => ({
        id_personal: p.id_personal,
        nombre_completo: p.nombre_completo,
        dias_completos: 0,
        medios_dias: 0,
        total_asistencia: 0,
        total_tareas_extra: 0,
        total_coccion: 0,
        total_adelantos: 0,
        total_descuentos: 0,
        total_final: 0,
        estado_pago: "Falta Pagar"
      }));

      setResumenPagos(resumen);
    } catch (error) {
      console.error("Error al cargar personal:", error);
      toast.error("Error al cargar personal");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdelantos = async (idSemana: string) => {
    try {
      const response = await fetch("/api/adelanto_pago");
      const data = await response.json();
      // Convertir monto a número para cada adelanto
      const adelantosProcessed = data.map((adelanto: AdelantoPersonal) => ({
        ...adelanto,
        monto: Number(adelanto.monto)
      }));
      setAdelantos(adelantosProcessed);
    } catch (error) {
      console.error("Error al cargar adelantos:", error);
      toast.error("Error al cargar los adelantos");
    }
  };

  // Modificar la función handleEditAdelanto
  const handleEditAdelanto = (adelanto: AdelantoPersonal) => {
    const formatISODate = (dateString: string) => {
      const date = new Date(dateString);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date.toISOString().split('T')[0];
    };

    setAdelantoData({
      ...adelanto,
      fecha: formatISODate(adelanto.fecha)
    });
    setAdelantoModalOpen(true);
  };

  const handleDeleteAdelanto = (id: number) => {
    setAdelantoToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDeleteAdelanto = async () => {
    if (adelantoToDelete === null) return;

    try {
      const response = await fetch(`/api/adelanto_pago/?id=${adelantoToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar adelanto');

      toast.success('Adelanto eliminado correctamente');
      // setShowConfirmModal(false);
      // Recargar adelantos
      if (semanaSeleccionada) {
        fetchAdelantos(semanaSeleccionada);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el adelanto');
    } finally {
      setAdelantoToDelete(null);
    }
  };

  // Modificar handleAdelantoSubmit
  const handleAdelantoSubmit = async () => {
    // Validaciones
    if (!semanaSeleccionada) {
      toast.error("Debe seleccionar una semana laboral");
      return;
    }

    if (!adelantoData.id_personal) {
      toast.error("Debe seleccionar un personal");
      return;
    }

    if (!adelantoData.fecha) {
      toast.error("Debe ingresar una fecha");
      return;
    }

    if (!adelantoData.monto || adelantoData.monto <= 0) {
      toast.error("Debe ingresar un monto válido");
      return;
    }

    try {
      setIsSubmitting(true);

      // Separar los datos relacionales de los datos directos
      const dataToSubmit = {
        ...(adelantoData.id_adelanto_pago && { id_adelanto_pago: adelantoData.id_adelanto_pago }),
        fecha: new Date(adelantoData.fecha + 'T00:00:00.000Z').toISOString(),
        monto: Number(adelantoData.monto),
        comentario: adelantoData.comentario || "",
        estado: "Pendiente",
        // Solo incluir las relaciones para nuevos registros (POST)
        ...((!adelantoData.id_adelanto_pago) && {
          id_personal: Number(adelantoData.id_personal),
          id_semana_laboral: Number(semanaSeleccionada),
        })
      };

      const response = await fetch("/api/adelanto_pago", {
        method: adelantoData.id_adelanto_pago ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al procesar adelanto");
      }

      toast.success(
        adelantoData.id_adelanto_pago
          ? "Adelanto actualizado correctamente"
          : "Adelanto registrado correctamente"
      );

      // setAdelantoModalOpen(false);

      // Resetear el formulario
      setAdelantoData({
        fecha: new Date().toISOString().split('T')[0]
      });

      // Recargar adelantos
      if (semanaSeleccionada) {
        fetchAdelantos(semanaSeleccionada);
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el adelanto");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modificar el useEffect existente para incluir la carga de asistencias
  useEffect(() => {
    if (semanaSeleccionada) {
      fetchAsistenciaSemana(semanaSeleccionada);
      fetchAdelantos(semanaSeleccionada);
    }
  }, [semanaSeleccionada]);

  async function handleTareaExtraSubmit(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();

    // Validación de semana laboral
    if (!semanaSeleccionada) {
      toast.error("Debe seleccionar una semana laboral");
      return;
    }

    // Validación de campos requeridos
    if (!tareaData.id_personal) {
      toast.error("Debe seleccionar un personal");
      return;
    }

    if (!tareaData.fecha) {
      toast.error("Debe ingresar una fecha");
      return;
    }

    if (!tareaData.monto || tareaData.monto <= 0) {
      toast.error("Debe ingresar un monto válido");
      return;
    }

    if (!tareaData.descripcion || tareaData.descripcion.trim() === "") {
      toast.error("Debe ingresar una descripción");
      return;
    }

    const dataToSubmit = {
      ...tareaData,
      id_semana_laboral: Number(semanaSeleccionada),
    };

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/tarea_extra", {
        method: tareaData.id_tarea_extra ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) throw new Error("Error al procesar tarea extra");

      toast.success(
        tareaData.id_tarea_extra
          ? "Tarea extra actualizada correctamente"
          : "Tarea extra registrada correctamente"
      );

      setTareaModalOpen(false);
      setTareaData({ fecha: new Date().toISOString().split("T")[0] });

      // Aquí podrías recargar las tareas extra y actualizar el resumen si es necesario
      // Por ejemplo: fetchTareasExtra(semanaSeleccionada);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la tarea extra");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Pago Personal</h1>
        <p className="text-muted-foreground">
          Registre pagos, adelantos, tareas extra, descuentos del personal.
        </p>
      </div>

      {/* Filtros y Acciones */}
      <div className="flex justify-between items-center gap-4">
        <div className="w-[300px]">
          <Label>Semana Laboral</Label>
          <Select value={semanaSeleccionada} onValueChange={setSemanaSeleccionada}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una semana" />
            </SelectTrigger>
            <SelectContent>
              {semanasLaboral.map((semana) => (
                <SelectItem
                  key={semana.id_semana_laboral}
                  value={semana.id_semana_laboral.toString()}
                >
                  {formatDate(semana.fecha_inicio)} - {formatDate(semana.fecha_fin)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => setAdelantoModalOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Adelanto Pago
          </Button>
          <Button onClick={() => setTareaModalOpen(true)}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Agregar Tarea Extra
          </Button>
        </div>
      </div>

      {/* Tabla de Resumen de Pagos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="align-bottom">Personal</TableHead>
              <TableHead colSpan={2} className="text-center border-b">Asistencia</TableHead>
              <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Asistencia</TableHead>
              <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Tareas Extra</TableHead>
              <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Cocción</TableHead>
              <TableHead rowSpan={2} className="text-right align-bottom">S/.<br />Adelantos</TableHead>
              <TableHead rowSpan={2} className="text-right align-bottom">S/.<br />Descuentos</TableHead>
              <TableHead rowSpan={2} className="text-right align-bottom">S/. Total<br />Final</TableHead>
              <TableHead rowSpan={2} className="text-center align-bottom">Estado</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center border-b">Días Completos</TableHead>
              <TableHead className="text-center border-b">Medios Días</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && resumenPagos.map((resumen) => (
              <TableRow key={resumen.id_personal}>
                <TableCell className="font-medium">{resumen.nombre_completo}</TableCell>
                <TableCell className="text-center">{resumen.dias_completos}</TableCell>
                <TableCell className="text-center">{resumen.medios_dias}</TableCell>
                <TableCell className="text-right">{resumen.total_asistencia.toFixed(2)}</TableCell>
                <TableCell className="text-right">{resumen.total_tareas_extra.toFixed(2)}</TableCell>
                <TableCell className="text-right">{resumen.total_coccion.toFixed(2)}</TableCell>
                <TableCell className="text-right">{resumen.total_adelantos.toFixed(2)}</TableCell>
                <TableCell className="text-right">{resumen.total_descuentos.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">{resumen.total_final.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={resumen.estado_pago === "Pagado" ? "default" : "secondary"}
                    className="w-full justify-center"
                  >
                    {resumen.estado_pago}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Cargando datos...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Adelanto */}
      <Dialog open={adelantoModalOpen} onOpenChange={setAdelantoModalOpen}>
        <DialogContent className="sm:max-w-[1000px] w-[90vw]">
          <DialogHeader>
            <DialogTitle> {adelantoData.id_adelanto_pago ? "Actualizar Adelanto" : "Registrar Adelanto"}</DialogTitle>
            <DialogDescription>
              {adelantoData.id_adelanto_pago
                ? "Modifique los detalles del adelanto de pago."
                : "Ingrese los detalles del adelanto de pago para el personal."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[2fr_3fr] gap-6">
            {/* Formulario de Adelanto */}
            <div className="space-y-4">
              {/* Información de la Semana */}
              <div className="rounded-lg border p-3 bg-muted/50">
                <Label>Semana Seleccionada:</Label>
                {semanaSeleccionada && (
                  <p className="text-sm mt-1">
                    {(() => {
                      const semana = semanasLaboral.find(s => s.id_semana_laboral.toString() === semanaSeleccionada);
                      if (semana) {
                        return `${formatDate(semana.fecha_inicio)} - ${formatDate(semana.fecha_fin)}`;
                      }
                      return "Seleccione una semana";
                    })()}
                  </p>
                )}
              </div>

              {/* Personal */}
              <div className="grid gap-2 w-full">
                <Label htmlFor="personal">Personal</Label>
                <Select
                  value={adelantoData.id_personal?.toString()}
                  onValueChange={(value) =>
                    setAdelantoData({
                      ...adelantoData,
                      id_personal: Number(value),
                      id_semana_laboral: Number(semanaSeleccionada),
                      estado: "Pendiente"
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione al personal" />
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

              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha de adelanto</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={adelantoData.fecha}
                  onChange={(e) =>
                    setAdelantoData({ ...adelantoData, fecha: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  value={adelantoData.monto || ""}
                  onChange={(e) =>
                    setAdelantoData({ ...adelantoData, monto: Number(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={adelantoData.comentario || ""}
                  onChange={(e) =>
                    setAdelantoData({ ...adelantoData, comentario: e.target.value })
                  }
                  placeholder="Ingrese una descripción"
                />
              </div>
            </div>

            {/* Tabla de Adelantos */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Personal</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adelantos.map((adelanto) => (
                    <TableRow key={adelanto.id_adelanto_pago}>
                      <TableCell>{formatDate(adelanto.fecha)}</TableCell>
                      <TableCell>
                        {personal.find(p => p.id_personal === adelanto.id_personal)?.nombre_completo}
                      </TableCell>
                      <TableCell className="text-right">
                        {(typeof adelanto.monto === 'number' ? adelanto.monto : Number(adelanto.monto)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={adelanto.estado === "Pendiente" ? "destructive" : "default"}
                          className={adelanto.estado === "Pendiente"
                            ? "bg-red-50 text-red-600 hover:bg-red-50"
                            : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {adelanto.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditAdelanto(adelanto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => adelanto.id_adelanto_pago && handleDeleteAdelanto(adelanto.id_adelanto_pago)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {adelantos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay adelantos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdelantoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdelantoSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {adelantoData.id_adelanto_pago ? "Actualizando..." : "Guardando..."}
                </>
              ) : (
                adelantoData.id_adelanto_pago ? "Actualizar" : "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Tarea Extra */}
      <Dialog open={tareaModalOpen} onOpenChange={setTareaModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Tarea Extra</DialogTitle>
            <DialogDescription>
              Ingrese los detalles de la tarea extra realizada por el personal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="personal">Personal</Label>
              <Select
                value={tareaData.id_personal?.toString()}
                onValueChange={(value) =>
                  setTareaData({ ...tareaData, id_personal: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione al personal" />
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

            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={tareaData.fecha}
                onChange={(e) =>
                  setTareaData({ ...tareaData, fecha: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción de la Tarea</Label>
              <Textarea
                id="descripcion"
                value={tareaData.descripcion || ""}
                onChange={(e) =>
                  setTareaData({ ...tareaData, descripcion: e.target.value })
                }
                placeholder="Describa la tarea extra realizada"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monto">Monto a Pagar</Label>
              <Input
                id="monto"
                type="number"
                value={tareaData.monto || ""}
                onChange={(e) =>
                  setTareaData({ ...tareaData, monto: Number(e.target.value) })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTareaModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTareaExtraSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="bg-red-500 text-white p-3 rounded-t-lg">
              Confirmar Eliminación
            </AlertDialogTitle>
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <AlertDialogDescription className="text-center text-base">
                ¿Estás seguro de que deseas eliminar este adelanto de pago?
                <p className="text-sm text-muted-foreground mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel className="mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAdelanto}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
