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
  estado_pago: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
  estado_entrega: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO';
  tipo_venta: 'DIRECTA' | 'CONTRATO';
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
  const [estadoPago, setEstadoPago] = useState<'PENDIENTE' | 'PAGADO' | 'ANULADO'>('PENDIENTE');
  const [estadoEntrega, setEstadoEntrega] = useState<'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO'>('NO ENTREGADO');
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA' | 'NINGUNO'>('NINGUNO');
  const [adelanto, setAdelanto] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>("");
  const [isAdelantoDirty, setIsAdelantoDirty] = useState(false);

  useEffect(() => {
    if (isOpen && ventaId) {
      fetchVentaDetalle(ventaId);
    } else {
      setVenta(null);
      resetForm();
    }
  }, [isOpen, ventaId]);

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
      
      const datosActualizados = {
        estado_pago: estadoPago,
        estado_entrega: estadoEntrega,
        tipo_comprobante: tipoComprobante,
        adelanto: adelanto,
        saldo_pendiente: saldoPendiente,
        observaciones: observaciones
      };
      
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

  // Función para renderizar los detalles de productos
  const renderProductos = () => {
    const detalles = venta?.detalles || venta?.detalle_venta || [];
    
    if (!detalles || detalles.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-4 py-2 text-sm text-center text-gray-500">No hay productos disponibles</td>
        </tr>
      );
    }

    return detalles.map((detalle, index) => (
      <tr key={index}>
        <td className="px-4 py-2 whitespace-nowrap text-sm">
          {detalle.nombre_producto || detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{detalle.cantidad}</td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">S/ {parseFloat(detalle.precio_unitario.toString()).toFixed(2)}</td>
        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">S/ {parseFloat(detalle.subtotal.toString()).toFixed(2)}</td>
      </tr>
    ));
  };

  // Función para renderizar los servicios
  const renderServicios = () => {
    const servicios = venta?.servicio_venta || [];
    
    if (!servicios || servicios.length === 0) {
      return null;
    }

    return (
      <>
        <h3 className="font-semibold mb-2">Servicios Adicionales:</h3>
        <div className="border rounded-md overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {servicios.map((servicio, index) => {
                const mostrarFlete = servicio.requiere_flete === 1 && servicio.costo_flete !== undefined && servicio.costo_flete > 0;
                const mostrarDescarga = servicio.requiere_descarga === 1 && servicio.costo_descarga !== undefined && servicio.costo_descarga > 0;

                return (
                  <>
                    {mostrarFlete && (
                      <tr key={`flete-${index}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">Flete</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{servicio.direccion_entrega || 'No especificada'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">S/ {parseFloat((servicio.costo_flete ?? 0).toString()).toFixed(2)}</td>
                      </tr>
                    )}
                    {mostrarDescarga && (
                      <tr key={`descarga-${index}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">Descarga</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">S/ {parseFloat((servicio.costo_descarga ?? 0).toString()).toFixed(2)}</td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
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
                    <h3 className="font-semibold mb-1">Cliente:</h3>
                    <p>{venta.cliente?.nombres_apellidos || venta.cliente?.razon_social || "Cliente Varios"}</p>
                    <p className="text-sm text-muted-foreground">
                      {venta.cliente?.dni ? `DNI: ${venta.cliente.dni}` : 
                       venta.cliente?.ruc ? `RUC: ${venta.cliente.ruc}` : ''}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Tipo de Venta:</h3>
                    <p>{venta.tipo_venta}</p>
                    <div className="flex space-x-2 mt-1">
                      <Badge variant="outline" className={
                        venta.estado_pago === 'PENDIENTE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        venta.estado_pago === 'PAGADO' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }>
                        {venta.estado_pago === 'PENDIENTE' ? 'Pago Pendiente' : 
                         venta.estado_pago === 'PAGADO' ? 'Pagado' : 'Anulado'}
                      </Badge>
                      <Badge variant="outline" className={
                        venta.estado_entrega === 'NO ENTREGADO' ? 'bg-red-50 text-red-700 border-red-200' :
                        venta.estado_entrega === 'PARCIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }>
                        {venta.estado_entrega === 'NO ENTREGADO' ? 'No Entregado' : 
                         venta.estado_entrega === 'PARCIAL' ? 'Entrega Parcial' : 'Entregado'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <h3 className="font-semibold mb-2">Detalle de Productos:</h3>
                <div className="border rounded-md overflow-hidden mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {renderProductos()}
                    </tbody>
                  </table>
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
                      <span className="font-semibold">S/ {parseFloat(venta.total.toString()).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoComprobante">Tipo de Comprobante</Label>
                  <Select 
                    value={tipoComprobante} 
                    onValueChange={(value: 'BOLETA' | 'FACTURA' | 'NINGUNO') => setTipoComprobante(value)}
                  >
                    <SelectTrigger id="tipoComprobante">
                      <SelectValue placeholder="Seleccione un tipo de comprobante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOLETA">Boleta</SelectItem>
                      <SelectItem value="FACTURA">Factura</SelectItem>
                      <SelectItem value="NINGUNO">Ninguno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adelanto">Adelanto (S/)</Label>
                  <Input
                    id="adelanto"
                    type="number"
                    value={adelanto}
                    onChange={(e) => handleAdelantoChange(e.target.value)}
                    min="0"
                    max={parseFloat(venta.total.toString())}
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones adicionales"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estadoPago">Estado de Pago</Label>
                  <Select 
                    value={estadoPago} 
                    onValueChange={(value: 'PENDIENTE' | 'PAGADO' | 'ANULADO') => setEstadoPago(value)}
                  >
                    <SelectTrigger id="estadoPago">
                      <SelectValue placeholder="Seleccione un estado de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="PAGADO">Pagado</SelectItem>
                      <SelectItem value="ANULADO">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estadoEntrega">Estado de Entrega</Label>
                  <Select 
                    value={estadoEntrega} 
                    onValueChange={(value: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO') => setEstadoEntrega(value)}
                  >
                    <SelectTrigger id="estadoEntrega">
                      <SelectValue placeholder="Seleccione un estado de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO ENTREGADO">No Entregado</SelectItem>
                      <SelectItem value="PARCIAL">Parcial</SelectItem>
                      <SelectItem value="ENTREGADO">Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isAdelantoDirty && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Saldo pendiente actualizado:</strong> S/ {(parseFloat(venta.total.toString()) - adelanto).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No se pudo cargar la información de la venta.
          </div>
        )}

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
