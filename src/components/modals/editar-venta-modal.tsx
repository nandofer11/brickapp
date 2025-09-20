"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash, Plus, Edit, Save, X, MinusCircle, PlusCircle, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Producto {
  id_producto: number;
  nombre: string;
  precio_venta: number;
  stock?: number;
}

interface Cliente {
  id_cliente?: number;
  nombres_apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
}

interface DetalleVenta {
  id_detalle_venta?: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nombre_producto?: string;
  producto?: {
    nombre: string;
  };
}

interface ServicioVenta {
  id_servicio_venta?: number;
  requiere_flete?: number;
  requiere_descarga?: number;
  direccion_entrega?: string;
  costo_flete?: number;
  costo_descarga?: number;
}

interface ComprobanteVenta {
  id_comprobante_venta: number;
  tipo_comprobante: 'BOLETA' | 'FACTURA' | 'NINGUNO';
  serie: string;
  numero: string;
  fecha_emision?: string;
}

interface Venta {
  id_venta: number;
  fecha_venta?: string;
  cliente?: Cliente;
  total: number | string;
  estado_pago: 'PENDIENTE' | 'ANULADO' | 'ANULADA' | 'CANCELADO' | 'PARCIAL';
  estado_entrega: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO' | 'ANULADA';
  tipo_venta: 'DIRECTA' | 'CONTRATO';
  estado_venta?: 'ACTIVA' | 'CERRADA' | 'ANULADA';
  adelanto?: number | string;
  saldo_pendiente?: number | string;
  observaciones?: string;
  detalles?: DetalleVenta[];
  detalle_venta?: DetalleVenta[];
  servicio_venta?: ServicioVenta[];
  comprobante_venta?: ComprobanteVenta[];
}

interface EditarVentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaId: number | null;
  onVentaActualizada: () => void;
}

export default function EditarVentaModal({ isOpen, onClose, ventaId, onVentaActualizada }: EditarVentaModalProps) {
  const [venta, setVenta] = useState<Venta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para editar la venta
  const [estadoPago, setEstadoPago] = useState<'PENDIENTE' | 'ANULADO' | 'ANULADA' | 'CANCELADO' | 'PARCIAL'>('PENDIENTE');
  const [estadoEntrega, setEstadoEntrega] = useState<'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO' | 'ANULADA'>('NO ENTREGADO');
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA' | 'NINGUNO'>('NINGUNO');
  const [adelanto, setAdelanto] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>("");
  const [isAdelantoDirty, setIsAdelantoDirty] = useState(false);
  
  // Estados para la edición de detalles y servicios
  const [detallesVenta, setDetallesVenta] = useState<DetalleVenta[]>([]);
  const [serviciosVenta, setServiciosVenta] = useState<ServicioVenta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showAddProductoForm, setShowAddProductoForm] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<number | null>(null);
  const [cantidadNueva, setCantidadNueva] = useState<number>(1);
  const [precioNuevo, setPrecioNuevo] = useState<number>(0);
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null);
  
  // Estados para servicios
  const [editandoServicios, setEditandoServicios] = useState(false);
  const [requiereFlete, setRequiereFlete] = useState(false);
  const [requiereDescarga, setRequiereDescarga] = useState(false);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [costoFlete, setCostoFlete] = useState<number>(0);
  const [costoDescarga, setCostoDescarga] = useState<number>(0);
  
  // Estado para manejar si hay cambios pendientes
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen && ventaId) {
      fetchVentaDetalle(ventaId);
      fetchProductos();
    } else {
      setVenta(null);
      resetForm();
    }
  }, [isOpen, ventaId]);

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      if (!res.ok) throw new Error('Error al cargar productos');
      
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar el listado de productos');
    }
  };

  const fetchVentaDetalle = async (id: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ventas/${id}`);
      if (!res.ok) throw new Error('Error al cargar detalles de la venta');
      
      const data = await res.json();
      setVenta(data);
      
      // Inicializar los campos del formulario
      setEstadoPago(data.estado_pago || 'PENDIENTE');
      setEstadoEntrega(data.estado_entrega || 'NO ENTREGADO');
      
      // Obtener tipo de comprobante del primer elemento si existe
      const tipoComp = data.comprobante_venta && data.comprobante_venta.length > 0 
        ? data.comprobante_venta[0].tipo_comprobante
        : 'NINGUNO';
      setTipoComprobante(tipoComp);
      
      setAdelanto(parseFloat(data.adelanto?.toString() || '0'));
      setObservaciones(data.observaciones || '');
      setIsAdelantoDirty(false);
      
      // Inicializar detalles de venta
      const detalles = data.detalles || data.detalle_venta || [];
      setDetallesVenta(detalles);
      
      // Inicializar servicios
      const servicios = data.servicio_venta || [];
      setServiciosVenta(servicios);
      
      if (servicios.length > 0) {
        const servicio = servicios[0];
        setRequiereFlete(servicio.requiere_flete === 1);
        setRequiereDescarga(servicio.requiere_descarga === 1);
        setDireccionEntrega(servicio.direccion_entrega || '');
        setCostoFlete(servicio.costo_flete || 0);
        setCostoDescarga(servicio.costo_descarga || 0);
      }
      
      setIsDirty(false);
    } catch (error) {
      console.error('Error al cargar detalles de venta:', error);
      toast.error('Error al cargar los detalles de la venta');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEstadoPago('PENDIENTE');
    setEstadoEntrega('NO ENTREGADO');
    setTipoComprobante('NINGUNO');
    setAdelanto(0);
    setObservaciones("");
    setIsAdelantoDirty(false);
    setDetallesVenta([]);
    setServiciosVenta([]);
    setRequiereFlete(false);
    setRequiereDescarga(false);
    setDireccionEntrega('');
    setCostoFlete(0);
    setCostoDescarga(0);
    setShowAddProductoForm(false);
    setSelectedProducto(null);
    setCantidadNueva(1);
    setPrecioNuevo(0);
    setEditandoDetalle(null);
    setEditandoServicios(false);
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!venta) return;
    
    try {
      setIsSaving(true);
      
      // Calcular saldo pendiente si el adelanto fue modificado
      let saldoPendiente = parseFloat(venta.saldo_pendiente?.toString() || '0');
      if (isAdelantoDirty) {
        const totalVenta = parseFloat(venta.total.toString());
        saldoPendiente = totalVenta - adelanto;
      }
      
      // Calcular el nuevo total si se han modificado los detalles o servicios
      let nuevoTotal = parseFloat(venta.total.toString());
      if (isDirty) {
        // Sumar todos los subtotales de los detalles
        const totalDetalles = detallesVenta.reduce((total, detalle) => total + detalle.subtotal, 0);
        
        // Sumar servicios adicionales
        let totalServicios = 0;
        if (requiereFlete) totalServicios += costoFlete;
        if (requiereDescarga) totalServicios += costoDescarga;
        
        nuevoTotal = totalDetalles + totalServicios;
        
        // Recalcular saldo pendiente con el nuevo total
        saldoPendiente = nuevoTotal - adelanto;
      }
      
      // Preparar datos de servicios para actualizar
      const servicioActualizado = {
        requiere_flete: requiereFlete,
        requiere_descarga: requiereDescarga,
        direccion_entrega: direccionEntrega,
        costo_flete: costoFlete,
        costo_descarga: costoDescarga,
        id_servicio_venta: serviciosVenta.length > 0 ? serviciosVenta[0].id_servicio_venta : undefined
      };
      
      // Preparar datos actualizados de la venta
      const datosActualizados = {
        estado_pago: estadoPago,
        estado_entrega: estadoEntrega,
        tipo_comprobante: tipoComprobante,
        adelanto: adelanto,
        saldo_pendiente: saldoPendiente,
        observaciones: observaciones,
        detalles: detallesVenta, // Siempre enviar los detalles
        servicios: [servicioActualizado], // Siempre enviar los servicios
        total: nuevoTotal // Siempre enviar el total actualizado
      };
      
      console.log('Datos a actualizar:', datosActualizados);
      
      const res = await fetch(`/api/ventas/${venta.id_venta}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados),
      });
      
      if (!res.ok) throw new Error('Error al actualizar la venta');
      
      toast.success('Venta actualizada correctamente');
      onVentaActualizada();
      onClose();
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      toast.error('Error al actualizar la venta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdelantoChange = (value: string) => {
    const adelantoValue = parseFloat(value) || 0;
    setAdelanto(adelantoValue);
    setIsAdelantoDirty(true);
    setIsDirty(true);
  };
  
  // Funciones para manejar detalles de productos
  const handleRemoveDetalle = (index: number) => {
    const nuevosDetalles = [...detallesVenta];
    nuevosDetalles.splice(index, 1);
    setDetallesVenta(nuevosDetalles);
    setIsDirty(true);
  };
  
  const handleEditDetalle = (index: number) => {
    const detalle = detallesVenta[index];
    setEditandoDetalle(index);
    setCantidadNueva(detalle.cantidad);
    setPrecioNuevo(detalle.precio_unitario);
  };
  
  const handleSaveDetalle = (index: number) => {
    const nuevosDetalles = [...detallesVenta];
    const detalle = nuevosDetalles[index];
    
    // Establecer los valores actualizados
    detalle.cantidad = Number(cantidadNueva);
    detalle.precio_unitario = Number(precioNuevo);
    
    // Calcular el subtotal correctamente
    detalle.subtotal = Number(cantidadNueva) * Number(precioNuevo);
    
    setDetallesVenta(nuevosDetalles);
    setEditandoDetalle(null);
    setIsDirty(true);
    
    console.log('Detalle actualizado:', detalle);
  };
  
  const handleCancelEditDetalle = () => {
    setEditandoDetalle(null);
    setCantidadNueva(1);
    setPrecioNuevo(0);
  };
  
  const handleAddProducto = () => {
    if (!selectedProducto) {
      toast.error('Debe seleccionar un producto');
      return;
    }
    
    const producto = productos.find(p => p.id_producto === selectedProducto);
    if (!producto) {
      toast.error('Producto no encontrado');
      return;
    }
    
    const nuevoDetalle: DetalleVenta = {
      id_producto: producto.id_producto,
      cantidad: Number(cantidadNueva),
      precio_unitario: Number(precioNuevo > 0 ? precioNuevo : producto.precio_venta),
      subtotal: Number(cantidadNueva) * Number(precioNuevo > 0 ? precioNuevo : producto.precio_venta),
      nombre_producto: producto.nombre
    };
    
    setDetallesVenta([...detallesVenta, nuevoDetalle]);
    setShowAddProductoForm(false);
    setSelectedProducto(null);
    setCantidadNueva(1);
    setPrecioNuevo(0);
    setIsDirty(true);
  };
  
  // Funciones para servicios
  const handleSaveServicios = () => {
    const servicioActualizado: ServicioVenta = {
      id_servicio_venta: serviciosVenta.length > 0 ? serviciosVenta[0].id_servicio_venta : undefined,
      requiere_flete: requiereFlete ? 1 : 0,
      requiere_descarga: requiereDescarga ? 1 : 0,
      direccion_entrega: direccionEntrega,
      costo_flete: Number(costoFlete),
      costo_descarga: Number(costoDescarga)
    };
    
    setServiciosVenta([servicioActualizado]);
    setEditandoServicios(false);
    setIsDirty(true);
    
    console.log('Servicio actualizado:', servicioActualizado);
  };
  
  const handleCancelEditServicios = () => {
    // Restaurar los valores originales
    if (serviciosVenta.length > 0) {
      const servicio = serviciosVenta[0];
      setRequiereFlete(servicio.requiere_flete === 1);
      setRequiereDescarga(servicio.requiere_descarga === 1);
      setDireccionEntrega(servicio.direccion_entrega || '');
      setCostoFlete(servicio.costo_flete || 0);
      setCostoDescarga(servicio.costo_descarga || 0);
    } else {
      setRequiereFlete(false);
      setRequiereDescarga(false);
      setDireccionEntrega('');
      setCostoFlete(0);
      setCostoDescarga(0);
    }
    
    setEditandoServicios(false);
  };

  // Función para obtener el tipo de comprobante de la venta
  const getTipoComprobante = () => {
    if (venta?.comprobante_venta && venta.comprobante_venta.length > 0) {
      return venta.comprobante_venta[0].tipo_comprobante || 'NINGUNO';
    }
    return tipoComprobante;
  };

  // Función para obtener el nombre y/o serie-número del comprobante
  const getComprobanteInfo = () => {
    if (venta?.comprobante_venta && venta.comprobante_venta.length > 0) {
      const comprobante = venta.comprobante_venta[0];
      return `${comprobante.serie}-${comprobante.numero}`;
    }
    return venta?.id_venta.toString().padStart(6, '0') || '';
  };

  // Función para calcular el total actualizado de la venta
  const calcularTotalActualizado = () => {
    // Sumar todos los subtotales de los detalles
    const totalDetalles = detallesVenta.reduce((total, detalle) => total + Number(detalle.subtotal || 0), 0);
    
    // Sumar servicios adicionales
    let totalServicios = 0;
    if (requiereFlete) totalServicios += Number(costoFlete || 0);
    if (requiereDescarga) totalServicios += Number(costoDescarga || 0);
    
    return Number(totalDetalles + totalServicios);
  };

  // Función para renderizar los detalles de productos
  const renderProductos = () => {
    if (!detallesVenta || detallesVenta.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-2 text-sm text-center text-gray-500">No hay productos disponibles</td>
        </tr>
      );
    }

    return detallesVenta.map((detalle, index) => (
      <tr key={`detalle-${index}`}>
        <td className="px-4 py-2 whitespace-nowrap text-sm">
          {detalle.nombre_producto || detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          {editandoDetalle === index ? (
            <Input 
              type="number" 
              value={cantidadNueva} 
              onChange={(e) => setCantidadNueva(Number(e.target.value))}
              min="1"
              step="1"
              className="w-20 text-right"
            />
          ) : (
            detalle.cantidad
          )}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          {editandoDetalle === index ? (
            <Input 
              type="number" 
              value={precioNuevo} 
              onChange={(e) => setPrecioNuevo(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-24 text-right"
            />
          ) : (
            `S/ ${parseFloat(detalle.precio_unitario.toString()).toFixed(2)}`
          )}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          {editandoDetalle === index 
            ? `S/ ${(cantidadNueva * precioNuevo).toFixed(2)}`
            : `S/ ${parseFloat(detalle.subtotal.toString()).toFixed(2)}`
          }
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          {editandoDetalle === index ? (
            <div className="flex justify-end space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-green-600"
                onClick={() => handleSaveDetalle(index)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-600"
                onClick={handleCancelEditDetalle}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-blue-600"
                onClick={() => handleEditDetalle(index)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-600"
                onClick={() => handleRemoveDetalle(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  // Función para renderizar el formulario de agregar producto
  const renderAddProductoForm = () => {
    if (!showAddProductoForm) return null;
    
    return (
      <tr>
        <td className="px-4 py-2 whitespace-nowrap text-sm">
          <Select value={selectedProducto?.toString() || ''} onValueChange={(value) => {
            const idProducto = parseInt(value);
            setSelectedProducto(idProducto);
            
            // Actualizar el precio con el precio por defecto del producto
            const producto = productos.find(p => p.id_producto === idProducto);
            if (producto) {
              setPrecioNuevo(producto.precio_venta);
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un producto" />
            </SelectTrigger>
            <SelectContent>
              {productos.map((producto) => (
                <SelectItem key={producto.id_producto} value={producto.id_producto.toString()}>
                  {producto.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          <Input 
            type="number" 
            value={cantidadNueva} 
            onChange={(e) => setCantidadNueva(Number(e.target.value))} 
            min="1"
            step="1"
            className="w-20 text-right"
          />
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          <Input 
            type="number" 
            value={precioNuevo} 
            onChange={(e) => setPrecioNuevo(Number(e.target.value))} 
            min="0"
            step="0.01"
            className="w-24 text-right"
          />
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          S/ {(cantidadNueva * precioNuevo).toFixed(2)}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
          <div className="flex justify-end space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-green-600"
              onClick={handleAddProducto}
              disabled={!selectedProducto || cantidadNueva <= 0 || precioNuevo <= 0}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-600"
              onClick={() => setShowAddProductoForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // Función para renderizar los servicios
  const renderServicios = () => {
    if (editandoServicios) {
      return renderServiciosForm();
    }
    
    // Verificar si hay servicios configurados
    const hayServicios = requiereFlete || requiereDescarga;
    
    if (!hayServicios) {
      return (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">No hay servicios adicionales configurados</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditandoServicios(true)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> Agregar Servicios
          </Button>
        </div>
      );
    }
    
    return (
      <>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Servicios Adicionales:</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditandoServicios(true)}
            className="text-xs"
          >
            <Edit className="h-3 w-3 mr-1" /> Editar
          </Button>
        </div>
        <div className="border rounded-md overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</TableHead>
                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requiereFlete && (
                <TableRow>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm capitalize">Flete</TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm">{direccionEntrega || 'No especificada'}</TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-right">S/ {Number(costoFlete).toFixed(2)}</TableCell>
                </TableRow>
              )}
              {requiereDescarga && (
                <TableRow>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm capitalize">Descarga</TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm">-</TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-right">S/ {Number(costoDescarga).toFixed(2)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  // Función para renderizar el formulario de edición de servicios
  const renderServiciosForm = () => {
    return (
      <div className="border rounded-md p-4 mb-4 bg-muted/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Editar Servicios Adicionales:</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveServicios}
              className="text-xs"
            >
              <Save className="h-3 w-3 mr-1" /> Guardar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEditServicios}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Cancelar
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiereFlete"
              checked={requiereFlete}
              onChange={(e) => setRequiereFlete(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="requiereFlete">Flete</Label>
          </div>

          {requiereFlete && (
            <div className="pl-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="direccionEntrega">Dirección de Entrega</Label>
                <Input
                  id="direccionEntrega"
                  value={direccionEntrega}
                  onChange={(e) => setDireccionEntrega(e.target.value)}
                  placeholder="Ingrese la dirección de entrega"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costoFlete">Costo de Flete (S/)</Label>
                <Input
                  id="costoFlete"
                  type="number"
                  value={costoFlete}
                  onChange={(e) => setCostoFlete(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiereDescarga"
              checked={requiereDescarga}
              onChange={(e) => setRequiereDescarga(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="requiereDescarga">Descarga</Label>
          </div>

          {requiereDescarga && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="costoDescarga">Costo de Descarga (S/)</Label>
              <Input
                id="costoDescarga"
                type="number"
                value={costoDescarga}
                onChange={(e) => setCostoDescarga(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Venta #{venta?.id_venta}</DialogTitle>
          <DialogDescription>
            Actualice los datos de la venta según sea necesario.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : venta ? (
          <>
            <Card className="border-2 border-muted mb-4">
              <CardHeader className="bg-muted/50 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {getTipoComprobante() === 'BOLETA' ? 'BOLETA DE VENTA' : 
                     getTipoComprobante() === 'FACTURA' ? 'FACTURA' : 'COMPROBANTE DE VENTA'}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-sm font-semibold">N° {getComprobanteInfo()}</p>
                    <p className="text-xs text-muted-foreground">
                      Fecha: {venta.fecha_venta ? format(new Date(venta.fecha_venta), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'No disponible'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold mb-2">Cliente:</h3>
                    <p>{venta.cliente?.nombres_apellidos || venta.cliente?.razon_social || "Cliente Varios"}</p>
                    <p className="text-sm text-muted-foreground">
                      {venta.cliente?.dni ? `DNI: ${venta.cliente.dni}` : 
                       venta.cliente?.ruc ? `RUC: ${venta.cliente.ruc}` : ''}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tipo de Venta:</h3>
                    <p className="mb-2">{venta.tipo_venta}</p>
                    
                    {/* Campos de estado editables */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="estadoPago" className="text-xs">Estado Pago</Label>
                          <Select value={estadoPago} onValueChange={(value) => setEstadoPago(value as any)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                              <SelectItem value="PARCIAL">Parcial</SelectItem>
                              <SelectItem value="CANCELADO">Cancelado</SelectItem>
                              <SelectItem value="ANULADA">Anulado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estadoEntrega" className="text-xs">Estado Entrega</Label>
                          <Select value={estadoEntrega} onValueChange={(value) => setEstadoEntrega(value as any)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NO ENTREGADO">No Entregado</SelectItem>
                              <SelectItem value="PARCIAL">Parcial</SelectItem>
                              <SelectItem value="ENTREGADO">Entregado</SelectItem>
                              <SelectItem value="ANULADA">Anulado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="tipoComprobante" className="text-xs">Tipo Comprobante</Label>
                          <Select value={tipoComprobante} onValueChange={(value) => setTipoComprobante(value as any)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NINGUNO">Ninguno</SelectItem>
                              <SelectItem value="BOLETA">Boleta</SelectItem>
                              <SelectItem value="FACTURA">Factura</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="adelanto" className="text-xs">Adelanto</Label>
                          <Input
                            id="adelanto"
                            type="number"
                            value={adelanto}
                            onChange={(e) => handleAdelantoChange(e.target.value)}
                            min="0"
                            step="0.01"
                            className="h-8 text-xs"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="observaciones" className="text-xs">Observaciones</Label>
                        <Textarea
                          id="observaciones"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          className="text-xs min-h-[60px]"
                          placeholder="Observaciones adicionales..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Detalle de Productos:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddProductoForm(true);
                      setSelectedProducto(null);
                      setCantidadNueva(1);
                      setPrecioNuevo(0);
                    }}
                    className="text-xs"
                    disabled={showAddProductoForm || editandoDetalle !== null}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Agregar Producto
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</TableHead>
                        <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</TableHead>
                        <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</TableHead>
                        <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</TableHead>
                        <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderProductos()}
                      {renderAddProductoForm()}
                    </TableBody>
                  </Table>
                </div>
                
                {renderServicios()}
                
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-right">
                    {parseFloat(venta.adelanto?.toString() || '0') > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">Adelanto:</span>
                          <span className="text-sm">S/ {parseFloat((venta.adelanto ?? 0).toString()).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Saldo:</span>
                          <span className="text-sm">S/ {parseFloat(venta.saldo_pendiente?.toString() || '0').toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Total:</span>
                      <span className="font-semibold">
                        {isDirty 
                          ? `S/ ${Number(calcularTotalActualizado()).toFixed(2)}`
                          : `S/ ${parseFloat(venta.total.toString()).toFixed(2)}`
                        }
                        {isDirty && (
                          <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">
                            Modificado
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No se pudo cargar la información de la venta.
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isDirty && (
            <div className="bg-yellow-50 text-yellow-800 p-2 rounded-md text-xs w-full sm:w-auto mb-2 sm:mb-0">
              Hay cambios pendientes que modificarán el total de la venta
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
