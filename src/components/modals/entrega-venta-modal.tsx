"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { es } from "date-fns/locale";

interface Producto {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface DetalleVenta {
  id_detalle_venta: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  producto?: {
    nombre: string;
  };
}

interface DetalleEntregaVenta {
  id_detalle_entrega_venta: number;
  id_producto: number;
  cantidad: number;
  producto?: {
    nombre: string;
  };
}

interface EntregaVenta {
  id_entrega_venta: number;
  id_venta: number;
  fecha: string;
  lugar_carga: string;
  detalle_entrega_venta: DetalleEntregaVenta[];
}

interface EntregaVentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaId: number | null;
  onEntregaRegistrada: () => void;
}

export default function EntregaVentaModal({ isOpen, onClose, ventaId, onEntregaRegistrada }: EntregaVentaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState<DetalleVenta[]>([]);
  const [historialEntregas, setHistorialEntregas] = useState<EntregaVenta[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  
  // Estado para modo edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [entregaEditando, setEntregaEditando] = useState<EntregaVenta | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entregaEliminar, setEntregaEliminar] = useState<EntregaVenta | null>(null);
  
  // Estado para el formulario
  const [fechaEntrega, setFechaEntrega] = useState<Date>(new Date());
  const [lugarCarga, setLugarCarga] = useState<"HORNO" | "ALMACEN">("HORNO");
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [cantidadEntrega, setCantidadEntrega] = useState<number>(0);
  const [cantidadDisponible, setCantidadDisponible] = useState<number>(0);

  useEffect(() => {
    if (isOpen && ventaId) {
      cargarDetallesVenta(ventaId);
      cargarHistorialEntregas(ventaId);
    } else {
      resetForm();
    }
  }, [isOpen, ventaId]);

  const cargarDetallesVenta = async (id: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ventas/${id}`);
      if (!res.ok) throw new Error('Error al cargar detalles de la venta');
      
      const data = await res.json();
      
      // Cargar detalles de productos de la venta
      const detalles = data.detalle_venta || [];
      setDetallesVenta(detalles);
      
      // Si hay productos, seleccionar el primero por defecto
      if (detalles.length > 0) {
        setProductoSeleccionado(detalles[0].id_producto);
        actualizarCantidadDisponible(detalles[0]);
      }
    } catch (error) {
      console.error('Error al cargar detalles de venta:', error);
      toast.error('Error al cargar los detalles de la venta');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const cargarHistorialEntregas = async (id: number) => {
    try {
      setIsLoadingHistorial(true);
      const res = await fetch(`/api/entrega_venta?ventaId=${id}`);
      if (!res.ok) throw new Error('Error al cargar historial de entregas');
      
      const data = await res.json();
      setHistorialEntregas(data);
    } catch (error) {
      console.error('Error al cargar historial de entregas:', error);
      toast.error('Error al cargar el historial de entregas');
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const actualizarCantidadDisponible = async (detalle: DetalleVenta) => {
    try {
      // Obtener las entregas previas para este producto en esta venta
      const res = await fetch(`/api/entrega_venta/detalles?ventaId=${ventaId}&productoId=${detalle.id_producto}`);
      if (!res.ok) throw new Error('Error al cargar entregas previas');
      
      const entregasPrevias = await res.json();
      
      // Calcular cuánto se ha entregado ya
      const cantidadEntregada = entregasPrevias.reduce((total: number, entrega: any) => {
        return total + entrega.cantidad;
      }, 0);
      
      // Calcular cuánto queda por entregar
      const disponible = detalle.cantidad - cantidadEntregada;
      setCantidadDisponible(disponible);
      
      // Establecer la cantidad de entrega al máximo disponible por defecto
      setCantidadEntrega(disponible);
    } catch (error) {
      console.error('Error al calcular cantidad disponible:', error);
      setCantidadDisponible(detalle.cantidad);
      setCantidadEntrega(detalle.cantidad);
    }
  };

  const resetForm = () => {
    setFechaEntrega(new Date());
    setLugarCarga("HORNO");
    setProductoSeleccionado(null);
    setCantidadEntrega(0);
    setCantidadDisponible(0);
    setDetallesVenta([]);
    setModoEdicion(false);
    setEntregaEditando(null);
    setShowDeleteConfirm(false);
    setEntregaEliminar(null);
  };

  const handleProductoChange = (id: string) => {
    const productoId = parseInt(id, 10);
    setProductoSeleccionado(productoId);
    
    // Buscar el detalle correspondiente al producto seleccionado
    const detalle = detallesVenta.find(d => d.id_producto === productoId);
    if (detalle) {
      actualizarCantidadDisponible(detalle);
    }
  };

  const handleSubmit = async () => {
    if (!ventaId || !productoSeleccionado) {
      toast.error('Seleccione un producto para la entrega');
      return;
    }

    if (cantidadEntrega <= 0) {
      toast.error('La cantidad a entregar debe ser mayor a 0');
      return;
    }

    if (cantidadEntrega > cantidadDisponible && !modoEdicion) {
      toast.error(`La cantidad a entregar no puede superar la cantidad disponible (${cantidadDisponible})`);
      return;
    }

    try {
      setIsSaving(true);
      
      const entregaData = {
        id_venta: ventaId,
        fecha_entrega: fechaEntrega,
        lugar_carga: lugarCarga,
        detalles: [{
          id_producto: productoSeleccionado,
          cantidad: cantidadEntrega
        }]
      };
      
      let url = '/api/entrega_venta';
      let method = 'POST';
      
      if (modoEdicion && entregaEditando) {
        url = `/api/entrega_venta/${entregaEditando.id_entrega_venta}`;
        method = 'PUT';
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entregaData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al registrar la entrega');
      }
      
      toast.success(modoEdicion ? 'Entrega actualizada correctamente' : 'Entrega registrada correctamente');
      onEntregaRegistrada();
      
      // Recargar historial y resetear formulario
      if (ventaId) {
        cargarHistorialEntregas(ventaId);
      }
      resetForm();
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar la entrega');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditarEntrega = (entrega: EntregaVenta) => {
    setModoEdicion(true);
    setEntregaEditando(entrega);
    
    // Establecer valores del formulario con los datos de la entrega a editar
    setFechaEntrega(new Date(entrega.fecha));
    setLugarCarga(entrega.lugar_carga as "HORNO" | "ALMACEN");
    
    if (entrega.detalle_entrega_venta && entrega.detalle_entrega_venta.length > 0) {
      const detalle = entrega.detalle_entrega_venta[0];
      setProductoSeleccionado(detalle.id_producto);
      setCantidadEntrega(detalle.cantidad);
      
      // Buscar el detalle de venta correspondiente para actualizar la cantidad disponible
      const detalleVenta = detallesVenta.find(d => d.id_producto === detalle.id_producto);
      if (detalleVenta) {
        actualizarCantidadDisponible(detalleVenta);
      }
    }
  };
  
  const handleEliminarEntrega = async () => {
    if (!entregaEliminar) return;
    
    try {
      setIsSaving(true);
      const res = await fetch(`/api/entrega_venta/${entregaEliminar.id_entrega_venta}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Error al eliminar la entrega');
      }
      
      toast.success('Entrega eliminada correctamente');
      setShowDeleteConfirm(false);
      setEntregaEliminar(null);
      onEntregaRegistrada();
      
      // Recargar historial
      if (ventaId) {
        cargarHistorialEntregas(ventaId);
      }
    } catch (error) {
      console.error('Error al eliminar entrega:', error);
      toast.error('Error al eliminar la entrega');
    } finally {
      setIsSaving(false);
    }
  };
  
  const confirmarEliminar = (entrega: EntregaVenta) => {
    setEntregaEliminar(entrega);
    setShowDeleteConfirm(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {modoEdicion ? 'Editar Entrega' : 'Registrar Entrega'}
          </DialogTitle>
          <DialogDescription>
            {modoEdicion 
              ? `Modifique los detalles de la entrega #${entregaEditando?.id_entrega_venta}`
              : `Complete los detalles para registrar una nueva entrega para la venta #${ventaId}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Fecha de entrega */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaEntrega ? format(fechaEntrega, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaEntrega}
                    onSelect={(date) => date && setFechaEntrega(date)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Lugar de carga */}
            <div className="space-y-2">
              <Label htmlFor="lugarCarga">Lugar de Carga</Label>
              <Select value={lugarCarga} onValueChange={(value: "HORNO" | "ALMACEN") => setLugarCarga(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar lugar de carga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HORNO">Horno</SelectItem>
                  <SelectItem value="ALMACEN">Almacén</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <Label htmlFor="producto">Producto</Label>
              <Select 
                value={productoSeleccionado?.toString() || ""} 
                onValueChange={handleProductoChange}
                disabled={detallesVenta.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {detallesVenta.map((detalle) => (
                    <SelectItem key={detalle.id_producto} value={detalle.id_producto.toString()}>
                      {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cantidad a entregar */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="cantidad">Cantidad a Entregar</Label>
                <span className="text-xs text-muted-foreground">
                  Disponible: {cantidadDisponible}
                </span>
              </div>
              <Input
                id="cantidad"
                type="number"
                value={cantidadEntrega}
                onChange={(e) => setCantidadEntrega(parseInt(e.target.value) || 0)}
                min={0}
                max={cantidadDisponible}
              />
            </div>
          </div>
        )}
        
        {/* Historial de entregas */}
        {!isLoading && historialEntregas.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-2">Historial de Entregas</h3>
            {isLoadingHistorial ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Producto</th>
                      <th className="p-2">Cantidad</th>
                      <th className="p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialEntregas.map((entrega) => (
                      <tr key={entrega.id_entrega_venta} className="border-b">
                        <td className="p-2">{format(new Date(entrega.fecha), 'dd/MM/yyyy')}</td>
                        <td className="p-2">
                          {entrega.detalle_entrega_venta[0]?.producto?.nombre || 
                            `Producto #${entrega.detalle_entrega_venta[0]?.id_producto}`}
                        </td>
                        <td className="p-2">{entrega.detalle_entrega_venta[0]?.cantidad}</td>
                        <td className="p-2 flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditarEntrega(entrega)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => confirmarEliminar(entrega)}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Diálogo de confirmación para eliminar */}
        {showDeleteConfirm && entregaEliminar && (
          <div className="border-t pt-4 mt-4">
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="font-medium text-red-800 mb-2">¿Eliminar esta entrega?</h4>
              <p className="text-sm text-red-700 mb-4">
                Fecha: {format(new Date(entregaEliminar.fecha), 'dd/MM/yyyy')} - 
                Cantidad: {entregaEliminar.detalle_entrega_venta[0]?.cantidad} - 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setEntregaEliminar(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleEliminarEntrega}
                  disabled={isSaving}
                >
                  {isSaving ? "Eliminando..." : "Confirmar Eliminación"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {modoEdicion && (
            <Button
              variant="outline"
              onClick={() => resetForm()}
              disabled={isSaving}
            >
              Cancelar Edición
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cerrar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving ? "Guardando..." : modoEdicion ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
