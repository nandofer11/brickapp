"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PlusCircle, Loader2, DollarSign, ClipboardList, Edit, Trash2, AlertTriangle, Eye, CreditCard } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

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

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



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

// Actualizar las interfaces para incluir las relaciones
interface TareaExtra {
  id_tarea_extra?: number;
  id_personal: number;
  id_semana_laboral: number;
  fecha: string;
  monto: string | number;
  descripcion: string;
  created_at: string;
  updated_at: string;
  personal?: Personal;
  semana_laboral?: SemanaLaboral;
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

interface CargoCoccion {
  id_cargo_coccion: number;
  nombre_cargo: string;
  costo_cargo: string;
}

interface CoccionPersonal {
  id_coccion_personal: number;
  coccion_id_coccion: number;
  personal_id_personal: number;
  cargo_coccion_id_cargo_coccion: number;
  personal: Personal;
  cargo_coccion: CargoCoccion;
}

interface Coccion {
  id_coccion: number;
  semana_laboral_id_semana_laboral: number;
  fecha_encendido: string;
  estado: string;
  semana_laboral: SemanaLaboral;
  coccion_personal: CoccionPersonal[];
}

export default function PagoPersonalPage() {
  const { empresa } = useAuthContext();
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
  const [isMultipleSelection, setIsMultipleSelection] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<number[]>([]);
  const [tareasExtra, setTareasExtra] = useState<TareaExtra[]>([]);

  // estado para manejar la selección de filas en la tabla principal 
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Agregar al componente principal, después de los estados existentes
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<ResumenPago | null>(null);

  const [descuentosModalOpen, setDescuentosModalOpen] = useState(false);
  const [descuentoTemp, setDescuentoTemp] = useState({
    monto: '',
    motivo: ''
  });
  const [descuentosSeleccionados, setDescuentosSeleccionados] = useState<{
    id?: number;
    tipo: 'adelanto' | 'descuento';
    monto: number;
    motivo: string;
  }[]>([]);

  // Función para obtener la fecha y hora actual en formato peruano
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      dateStyle: 'long',
      timeStyle: 'medium'
    });
  };

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

      // Actualizar los totales de adelantos en el resumen de pagos
      setResumenPagos(prev => prev.map(resumen => {
        // Filtrar adelantos por personal y sumar los montos
        interface AdelantoPersonalWithSemana extends AdelantoPersonal {
          id_semana_laboral: number;
        }

        const adelantosPersonal: AdelantoPersonalWithSemana[] = adelantosProcessed.filter(
          (adelanto: AdelantoPersonalWithSemana) =>
            adelanto.id_personal === resumen.id_personal &&
            adelanto.id_semana_laboral.toString() === idSemana
        );
        const totalAdelantos = adelantosPersonal.reduce(
          (sum, adelanto) => sum + Number(adelanto.monto),
          0
        );

        return {
          ...resumen,
          total_adelantos: totalAdelantos,
          // Recalcular el total final
          total_final: resumen.total_asistencia +
            resumen.total_tareas_extra +
            resumen.total_coccion -
            totalAdelantos -
            resumen.total_descuentos
        };
      }));
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

        await actualizarResumenPagos(semanaSeleccionada);
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
      fetchTareasExtra(semanaSeleccionada);
      actualizarResumenPagos(semanaSeleccionada);
    }
  }, [semanaSeleccionada]);

  // Agregar la función fetchTareasExtra
  const fetchTareasExtra = async (idSemana: string) => {
    try {
      const response = await fetch("/api/tarea_extra");
      if (!response.ok) throw new Error("Error al obtener tareas extras");

      const data = await response.json();

      // Filtrar por semana seleccionada
      const tareasFiltradas = data.filter(
        (tarea: TareaExtra) => tarea.id_semana_laboral.toString() === idSemana
      );

      setTareasExtra(tareasFiltradas);

      // Actualizar los totales en el resumen de pagos
      setResumenPagos(prev => prev.map(resumen => {
        const tareasPorPersonal: TareaExtra[] = tareasFiltradas.filter(
          (tarea: TareaExtra) => tarea.id_personal === resumen.id_personal
        );
        const totalTareasExtra = tareasPorPersonal.reduce(
          (sum, tarea) => sum + Number(tarea.monto),
          0
        );

        return {
          ...resumen,
          total_tareas_extra: totalTareasExtra,
          total_final: resumen.total_asistencia +
            totalTareasExtra +
            resumen.total_coccion -
            resumen.total_adelantos -
            resumen.total_descuentos
        };
      }));

    } catch (error) {
      console.error("Error al cargar tareas extra:", error);
      toast.error("Error al cargar las tareas extra");
    }
  };

  // Modificar la función handleTareaExtraSubmit
  async function handleTareaExtraSubmit(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();

    try {
      // Validación de la semana laboral
      if (!semanaSeleccionada) {
        toast.error("Debe seleccionar una semana laboral");
        return;
      }

      // Validación de personal según el modo de selección
      if (isMultipleSelection) {
        if (selectedPersonal.length === 0) {
          toast.error("Debe seleccionar al menos un personal");
          return;
        }
      } else {
        if (!tareaData.id_personal) {
          toast.error("Debe seleccionar un personal");
          return;
        }
      }

      // Validación de fecha
      if (!tareaData.fecha) {
        toast.error("Debe ingresar una fecha");
        return;
      }

      // Validación de monto
      if (!tareaData.monto || Number(tareaData.monto) <= 0) {
        toast.error("El monto debe ser mayor a 0");
        return;
      }

      setIsSubmitting(true);

      // Preparar datos base
      const tareaToSubmit = {
        fecha: new Date(tareaData.fecha + 'T00:00:00.000Z').toISOString(),
        monto: Number(tareaData.monto),
        descripcion: tareaData.descripcion || "",
        id_semana_laboral: Number(semanaSeleccionada),
      };

      if (tareaData.id_tarea_extra) {
        // Modo edición
        const response = await fetch(`/api/tarea_extra?id=${tareaData.id_tarea_extra}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...tareaToSubmit,
            id_tarea_extra: tareaData.id_tarea_extra,
            id_personal: tareaData.id_personal
          }),
        });

        if (!response.ok) {
          throw new Error("Error al actualizar la tarea extra");
        }

        toast.success("Tarea extra actualizada correctamente");
      } else {
        // Modo creación (existente)
        if (isMultipleSelection) {
          const tareasMultiples = selectedPersonal.map(idPersonal => ({
            ...tareaToSubmit,
            id_personal: idPersonal,
          }));

          const response = await fetch("/api/tarea_extra", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tareasMultiples),
          });

          if (!response.ok) {
            throw new Error("Error al registrar las tareas extras");
          }

          toast.success(`${selectedPersonal.length} tareas extras registradas correctamente`);
        } else {
          const response = await fetch("/api/tarea_extra", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...tareaToSubmit,
              id_personal: Number(tareaData.id_personal),
            }),
          });

          if (!response.ok) {
            throw new Error("Error al registrar la tarea extra");
          }

          toast.success("Tarea extra registrada correctamente");
        }
      }

      // Recargar datos y limpiar formulario
      await fetchTareasExtra(semanaSeleccionada);
      await actualizarResumenPagos(semanaSeleccionada);

      setTareaModalOpen(false);
      setTareaData({ fecha: new Date().toISOString().split('T')[0] });
      setSelectedPersonal([]);
      setIsMultipleSelection(false);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la tarea extra");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Agregar función para eliminar tarea extra
  const handleDeleteTareaExtra = async (id: number) => {
    try {
      const response = await fetch(`/api/tarea_extra/?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar tarea extra');

      toast.success('Tarea extra eliminada correctamente');
      // Recargar tareas extras
      if (semanaSeleccionada) {
        await fetchTareasExtra(semanaSeleccionada);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la tarea extra');
    }
  };

  // Crear una función para actualizar el resumen de forma centralizada
  const actualizarResumenPagos = async (idSemana: string) => {
    try {
      setIsLoading(true);

      // Modificar el endpoint para obtener las cocciones por semana
      const [asistenciasResponse, adelantosResponse, tareasExtraResponse, coccionesResponse] = await Promise.all([
        fetch("/api/asistencia"),
        fetch("/api/adelanto_pago"),
        fetch("/api/tarea_extra"),
        fetch(`/api/coccion?id_semana_laboral=${idSemana}`)  // Cambiar aquí el endpoint
      ]);

      const [asistencias, adelantos, tareasExtra, cocciones] = await Promise.all([
        asistenciasResponse.json(),
        adelantosResponse.json(),
        tareasExtraResponse.json(),
        coccionesResponse.json()
      ]);

      // Asegurar que cocciones sea un array
      const coccionesSemana = Array.isArray(cocciones) ? cocciones : [];

      // Filtrar datos por semana
      const asistenciasSemana = asistencias.filter((a: any) =>
        a.id_semana_laboral.toString() === idSemana
      );
      const adelantosSemana = adelantos.filter((a: any) =>
        a.id_semana_laboral.toString() === idSemana
      );
      const tareasExtraSemana = tareasExtra.filter((t: any) =>
        t.id_semana_laboral.toString() === idSemana
      );

      // Actualizar el resumen en una sola operación
      setResumenPagos(prev => prev.map(resumen => {
        // Calcular asistencias
        const asistenciasPersonal = asistenciasSemana.filter((a: any) =>
          a.id_personal === resumen.id_personal
        );
        const dias_completos = asistenciasPersonal.filter((a: any) => a.estado === "A").length;
        const medios_dias = asistenciasPersonal.filter((a: any) => a.estado === "M").length;

        // Calcular pago por asistencia
        const personalObj = personal.find(p => p.id_personal === resumen.id_personal);
        const pagoDiarioNormal = personalObj ? personalObj.pago_diario_normal : 0;
        const total_asistencia = (dias_completos * pagoDiarioNormal) +
          (medios_dias * (pagoDiarioNormal / 2));

        // Calcular adelantos
        const adelantosPersonal = adelantosSemana.filter(
          (a: any) => a.id_personal === resumen.id_personal
        );
        const total_adelantos = adelantosPersonal.reduce(
          (sum: number, adelanto: any) => sum + Number(adelanto.monto),
          0
        );

        // Calcular tareas extra
        const tareasPersonal = tareasExtraSemana.filter(
          (t: any) => t.id_personal === resumen.id_personal
        );
        const total_tareas_extra = tareasPersonal.reduce(
          (sum: number, tarea: any) => sum + Number(tarea.monto),
          0
        );

        // Calcular total de cocción
        const total_coccion = coccionesSemana.reduce((sum, coccion) => {
          // Encontrar todas las participaciones del personal en esta cocción
          // Define interfaces for the nested objects if not already defined
          interface CoccionPersonalWithCargo extends CoccionPersonal {
            cargo_coccion: CargoCoccion;
          }
          interface CoccionWithPersonal extends Coccion {
            coccion_personal: CoccionPersonalWithCargo[];
          }

          const participacionesPersonal = (coccion as CoccionWithPersonal).coccion_personal?.filter(
            (cp: CoccionPersonalWithCargo) => cp.personal_id_personal === resumen.id_personal
          ) || [];

          // Sumar los costos de cargo para cada participación
          const costoCargo = participacionesPersonal.reduce((cargoSum, participacion) => {
            const costoCargo = participacion.cargo_coccion?.costo_cargo;
            return cargoSum + (costoCargo ? Number(costoCargo) : 0);
          }, 0);

          return sum + costoCargo;
        }, 0);

        // Calcular total final incluyendo el total de cocción
        const total_final = total_asistencia + total_tareas_extra +
          total_coccion - total_adelantos - resumen.total_descuentos;

        return {
          ...resumen,
          dias_completos,
          medios_dias,
          total_asistencia,
          total_tareas_extra,
          total_adelantos,
          total_coccion, // Asegurarnos de incluir el total_coccion actualizado
          total_final
        };
      }));

    } catch (error) {
      console.error("Error al actualizar resumen:", error);
      toast.error("Error al actualizar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDescuentosModal = () => {
    setDescuentosModalOpen(false);
    setDescuentoTemp({ monto: '', motivo: '' });
    setDescuentosSeleccionados([]);
  };


  function handlePagoClick(resumen: ResumenPago) {
    setSelectedPago(resumen);
    setPagoModalOpen(true);
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
      <div className="flex flex-col md:flex-row justify-between gap-2">
        <div className="w-full md:w-[300px]">
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

        {/* card total asistencia */}
        <div>
          <Card className="w-[320px] bg-blue-50/50 py-0">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Asistencia, T.Extra, Cocción
                  </CardDescription>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  S/. {resumenPagos.reduce((sum, item) =>
                    sum + item.total_asistencia + item.total_tareas_extra + item.total_coccion,
                    0
                  ).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        <div className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-2">
          <Button
            onClick={() => setAdelantoModalOpen(true)}
            className="w-full md:w-auto"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Adelanto Pago
          </Button>
          <Button
            onClick={() => setTareaModalOpen(true)}
            className="w-full md:w-auto"
          >
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
              <TableHead rowSpan={2} className="text-right align-bottom">Acciones</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center border-b">Días Completos</TableHead>
              <TableHead className="text-center border-b">Medios Días</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && resumenPagos.map((resumen) => (
              <TableRow key={resumen.id_personal}
                className={`cursor-pointer transition-colors ${selectedRow === resumen.id_personal
                  ? "bg-muted hover:bg-muted/80"
                  : "hover:bg-muted/50"
                  }`}
                onClick={() => setSelectedRow(resumen.id_personal)}
              >
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
                    className={resumen.estado_pago === "Pagado"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-red-50 text-red-600 hover:bg-red-50"
                    }
                  >
                    {resumen.estado_pago}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Implementar ver detalle
                        toast.info("Ver detalle del pago");
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePagoClick(resumen);
                      }}
                      disabled={resumen.estado_pago === "Pagado"}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </div>
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
        <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {adelantoData.id_adelanto_pago ? "Actualizar Adelanto" : "Registrar Adelanto"}
            </DialogTitle>
            <DialogDescription>
              {adelantoData.id_adelanto_pago
                ? "Modifique los detalles del adelanto de pago."
                : "Ingrese los detalles del adelanto de pago para el personal."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 md:gap-6">
            {/* Formulario de Adelanto */}
            <div className="space-y-3 md:space-y-4">
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

              {/* Personal Select */}
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
                  disabled={!!adelantoData.id_adelanto_pago} // Deshabilitar en modo edición
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
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
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
        <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>
              {tareaData.id_tarea_extra ? "Editar Tarea Extra" : "Registrar Tarea Extra"}
            </DialogTitle>
            <DialogDescription>
              {tareaData.id_tarea_extra
                ? "Modifique los detalles de la tarea extra."
                : "Ingrese los detalles de la tarea extra realizada por el personal."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4">
            {/* Formulario de Tarea Extra */}
            <div className="space-y-3">
              {/* Información de la Semana */}
              <div className="rounded-lg border p-2 bg-muted/50">
                <Label>Semana Seleccionada:</Label>
                {semanaSeleccionada && (
                  <p className="text-sm mt-0.5">
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

              <div className="space-y-1.5">
                <Label htmlFor="selection-mode">Modo de selección</Label>
                <Select
                  value={isMultipleSelection ? "multiple" : "single"}
                  onValueChange={(value) => {
                    setIsMultipleSelection(value === "multiple");
                    setSelectedPersonal([]);
                    setTareaData(prev => {
                      const { id_personal, ...rest } = prev;
                      return { ...rest };
                    });
                  }}
                  disabled={!!tareaData.id_tarea_extra} // Deshabilitar si es edición
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Personal Individual</SelectItem>
                    <SelectItem value="multiple">Múltiples Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="personal">
                  {isMultipleSelection ? "Seleccionar Personal" : "Personal"}
                </Label>
                {isMultipleSelection ? (
                  <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1">
                    {personal.map((p) => (
                      <div key={p.id_personal} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`personal-${p.id_personal}`}
                          checked={selectedPersonal.includes(p.id_personal)}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...selectedPersonal, p.id_personal]
                              : selectedPersonal.filter(id => id !== p.id_personal);
                            setSelectedPersonal(newSelected);
                            setTareaData(prev => {
                              // Remove id_personal from tareaData in multiple mode to avoid type error
                              const { id_personal, ...rest } = prev;
                              return { ...rest };
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`personal-${p.id_personal}`}
                          className="text-sm cursor-pointer"
                        >
                          {p.nombre_completo}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Select
                    value={tareaData.id_personal?.toString()}
                    onValueChange={(value) =>
                      setTareaData({ ...tareaData, id_personal: Number(value) })
                    }
                    disabled={!!tareaData.id_tarea_extra} // Deshabilitar si es edición
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
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label htmlFor="descripcion">Descripción de la Tarea</Label>
                <Textarea
                  id="descripcion"
                  value={tareaData.descripcion || ""}
                  onChange={(e) =>
                    setTareaData({ ...tareaData, descripcion: e.target.value })
                  }
                  placeholder="Describa la tarea extra realizada"
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Tabla de Tareas Extras */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Personal</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tareasExtra.length > 0 ? (
                      tareasExtra.map((tarea) => (
                        <TableRow key={tarea.id_tarea_extra}>
                          <TableCell>{formatDate(tarea.fecha)}</TableCell>
                          <TableCell>{tarea.personal?.nombre_completo}</TableCell>
                          <TableCell>{tarea.descripcion}</TableCell>
                          <TableCell className="text-right">
                            {Number(tarea.monto).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setTareaData({
                                    ...tarea,
                                    // Convertir la fecha ISO a formato YYYY-MM-DD para el input type="date"
                                    fecha: new Date(tarea.fecha).toISOString().split('T')[0],
                                    monto: Number(tarea.monto)
                                  });
                                  setIsMultipleSelection(false);
                                  setTareaModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  tarea.id_tarea_extra && handleDeleteTareaExtra(tarea.id_tarea_extra)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No hay tareas extras registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTareaModalOpen(false);
              setSelectedPersonal([]);
              setIsMultipleSelection(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleTareaExtraSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tareaData.id_tarea_extra ? "Actualizando..." : "Guardando..."}
                </>
              ) : (
                tareaData.id_tarea_extra ? "Actualizar" : "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Modal de Pago */}
      <Dialog open={pagoModalOpen} onOpenChange={setPagoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Detalles del Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 print:p-4">
            {/* Cabecera de la empresa */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">{empresa?.razon_social}</h3>
              <p className="text-sm">RUC: {empresa?.ruc}</p>
              <p className="text-sm">{empresa?.direccion}</p>
            </div>

            {/* Título del recibo */}
            <div className="text-center border-y py-2">
              <h2 className="font-bold text-xl">RECIBO PAGO</h2>
            </div>

            {/* Información del pago */}
            {selectedPago && (
              <div className="space-y-4">
                {/* Fecha y Personal */}
                <div className="space-y-2">
                  <p><span className="font-semibold">Fecha y Hora:</span> {getCurrentDateTime()}</p>
                  <p>
                    <span className="font-semibold">Personal:</span> {
                      personal.find(p => p.id_personal === selectedPago.id_personal)?.dni
                    } - {selectedPago.nombre_completo}
                  </p>
                </div>

                {/* Detalle del pago */}
                <div className="space-y-2 border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span>Total Semana S/.</span>
                    <span>{selectedPago.total_asistencia.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tareas Extra S/.</span>
                    <span>{selectedPago.total_tareas_extra.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Servicios cocción S/.</span>
                    <span>{selectedPago.total_coccion.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Descuentos S/.</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDescuentosModalOpen(true)}
                        className="h-8"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <span>{selectedPago.total_descuentos.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total Final */}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>TOTAL S/.</span>
                    <span>{selectedPago.total_final.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPagoModalOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  // Implementar lógica de pago
                  toast.info("Función de pago pendiente");
                }}
              >
                Pagar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agregar el nuevo modal de descuentos */}
      <Dialog
        open={descuentosModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDescuentosModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Descuentos</DialogTitle>
            <DialogDescription>
              Seleccione adelantos pendientes o agregue nuevos descuentos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sección de Adelantos Pendientes */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Adelantos Pendientes</h4>
              <div className="max-h-[150px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Comentario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adelantos
                      .filter(a =>
                        a.id_personal === selectedPago?.id_personal &&
                        a.estado === "Pendiente"
                      )
                      .map((adelanto) => (
                        <TableRow key={adelanto.id_adelanto_pago}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={descuentosSeleccionados.some(
                                d => d.tipo === 'adelanto' && d.id === adelanto.id_adelanto_pago
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDescuentosSeleccionados([
                                    ...descuentosSeleccionados,
                                    {
                                      id: adelanto.id_adelanto_pago,
                                      tipo: 'adelanto',
                                      monto: adelanto.monto,
                                      motivo: adelanto.comentario || 'Adelanto de pago'
                                    }
                                  ]);
                                } else {
                                  setDescuentosSeleccionados(
                                    descuentosSeleccionados.filter(
                                      d => !(d.tipo === 'adelanto' && d.id === adelanto.id_adelanto_pago)
                                    )
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>{formatDate(adelanto.fecha)}</TableCell>
                          <TableCell>S/. {adelanto.monto.toFixed(2)}</TableCell>
                          <TableCell>{adelanto.comentario || '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Formulario para Nuevo Descuento */}
            <div className="space-y-3">
              <h4 className="font-medium">Agregar Nuevo Descuento</h4>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="monto" className="text-sm">Monto</Label>
                  <Input
                    id="monto"
                    type="number"
                    value={descuentoTemp.monto}
                    onChange={(e) => setDescuentoTemp({
                      ...descuentoTemp,
                      monto: e.target.value
                    })}
                    placeholder="0.00"
                    className="h-8"
                  />
                </div>
                <div className="flex-[2]">
                  <Label htmlFor="motivo" className="text-sm">Motivo</Label>
                  <Input
                    id="motivo"
                    value={descuentoTemp.motivo}
                    onChange={(e) => setDescuentoTemp({
                      ...descuentoTemp,
                      motivo: e.target.value
                    })}
                    placeholder="Motivo del descuento"
                    className="h-8"
                  />
                </div>
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (!descuentoTemp.monto || !descuentoTemp.motivo) {
                      toast.error("Complete todos los campos");
                      return;
                    }
                    setDescuentosSeleccionados([
                      ...descuentosSeleccionados,
                      {
                        tipo: 'descuento',
                        monto: Number(descuentoTemp.monto),
                        motivo: descuentoTemp.motivo
                      }
                    ]);
                    setDescuentoTemp({ monto: '', motivo: '' });
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Resumen de Descuentos Seleccionados */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Descuentos Seleccionados</h4>
              <div className="max-h-[150px] overflow-y-auto border rounded-md p-4">
                {descuentosSeleccionados.map((descuento, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium">{descuento.motivo}</span>
                      <Badge className="ml-2">
                        {descuento.tipo === 'adelanto' ? 'Adelanto' : 'Descuento'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>S/. {descuento.monto.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDescuentosSeleccionados(
                            descuentosSeleccionados.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {descuentosSeleccionados.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No hay descuentos seleccionados
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Total Descuentos:</span>
                <span>S/. {descuentosSeleccionados.reduce((sum, d) => sum + d.monto, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={handleCloseDescuentosModal}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Actualizar el total de descuentos en el pago
                const totalDescuentos = descuentosSeleccionados.reduce((sum, d) => sum + d.monto, 0);
                setSelectedPago(prev => prev ? {
                  ...prev,
                  total_descuentos: totalDescuentos,
                  total_final: prev.total_asistencia + prev.total_tareas_extra +
                    prev.total_coccion - totalDescuentos
                } : null);
                handleCloseDescuentosModal();
              }}
            >
              Aplicar Descuentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
