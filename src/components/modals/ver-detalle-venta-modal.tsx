"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext"; // Importamos el contexto de autenticación
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/dateFormat";
import { Printer } from "lucide-react";

interface Cliente {
  id_cliente?: number;
  nombres_apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
  direccion?: string;
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
  tipo_comprobante: 'BOLETA' | 'FACTURA' | 'TICKET' | 'NINGUNO';
  serie: string;
  numero: string;
  fecha_emision?: string;
}

interface Venta {
  id_venta: number;
  fecha_venta?: string;
  fecha?: string; // Campo alternativo para fecha
  cliente?: Cliente;
  total: number | string;
  estado_pago: 'PENDIENTE' | 'CANCELADO' | 'PARCIAL' | 'ANULADO';
  estado_entrega: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO';
  tipo_venta: 'DIRECTA' | 'CONTRATO';
  adelanto?: number | string;
  saldo_pendiente?: number | string;
  observaciones?: string;
  detalles?: DetalleVenta[];
  detalle_venta?: DetalleVenta[];
  servicio_venta?: ServicioVenta[];
  comprobante_venta?: ComprobanteVenta[];
  forma_pago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE';
}

interface VerDetalleVentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaId: number | null;
}

export default function VerDetalleVentaModal({ isOpen, onClose, ventaId }: VerDetalleVentaModalProps) {
  const { empresa } = useAuthContext(); // Obtenemos la empresa del contexto de autenticación
  const [venta, setVenta] = useState<Venta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ventaId) {
      fetchVentaDetalles();
    }
  }, [isOpen, ventaId]);

  const fetchVentaDetalles = async () => {
    if (!ventaId) return;
    
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ventas/${ventaId}`);
      
      if (!res.ok) throw new Error('Error al cargar los detalles de la venta');
      
      const data = await res.json();
      setVenta(data);
    } catch (error) {
      console.error('Error al cargar detalles de venta:', error);
      toast.error('Error al cargar los detalles de la venta');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para imprimir el ticket
  const imprimirTicket = () => {
    try {
      toast.info("Preparando ticket para impresión...");

      // Contenido HTML del ticket
      let contenido = document.getElementById('ticket-imprimir')?.innerHTML;
      if (!contenido) {
        toast.error("No se pudo generar el contenido para imprimir");
        return;
      }

      // Estilos para la ventana de impresión
      const printStyles = `
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            width: 80mm;
            margin: 0 auto;
            padding: 2mm;
          }
          .header {
            text-align: center;
            margin-bottom: 3mm;
          }
          .header img {
            max-height: 8mm;
            margin-bottom: 2mm;
          }
          .empresa-info {
            text-align: center;
            margin-bottom: 2mm;
            line-height: 1.1;
          }
          .empresa-info h2 {
            margin-bottom: 0;
          }
          .empresa-info p {
            margin: 0;
          }
          .comprobante-info {
            text-align: center;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 1mm 0;
            margin: 2mm 0;
            line-height: 1.1;
          }
          .comprobante-info h3 {
            margin: 0;
          }
          .comprobante-info p {
            margin: 0;
          }
          .fecha-info {
            text-align: center;
            font-size: 9pt;
            margin: 1mm 0;
          }
          .cliente-info {
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            padding: 2mm 0;
            margin: 2mm 0;
          }
          .title {
            font-weight: bold;
            font-size: 12pt;
            margin: 2mm 0;
            text-align: center;
          }
          .subtitle {
            font-size: 10pt;
            margin: 1mm 0;
            text-align: center;
          }
          .border-top {
            border-top: 1px solid #000;
            padding-top: 2mm;
          }
          .border-bottom {
            border-bottom: 1px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 1mm 0;
          }
          .product-row {
            margin-bottom: 1mm;
          }
          .section-title {
            text-align: center;
            font-weight: bold;
            margin: 2mm 0;
          }
          .productos-section {
            border-bottom: 1px solid #ddd;
            padding-bottom: 2mm;
          }
          .servicios-section {
            border-bottom: 1px solid #ddd;
            padding: 2mm 0;
          }
          .totales-section {
            text-align: center;
            margin-top: 3mm;
            font-size: 11pt;
            font-weight: bold;
          }
          .total-item {
            margin: 1mm 0;
          }
          .total-final {
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            padding: 1mm 0;
            margin: 2mm 0;
            font-size: 12pt;
          }
          .bold {
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: left;
            padding: 1mm 0;
          }
          th {
            font-weight: bold;
          }
          .agradecimiento-section {
            text-align: center;
            margin-top: 4mm;
            border-top: 1px solid #ddd;
            padding-top: 2mm;
          }
          .agradecimiento-section p {
            margin: 0;
            text-align: center;
            width: 100%;
            display: block;
          }
          .agradecimiento {
            text-align: center;
            margin-top: 5mm;
            font-size: 10pt;
            font-weight: medium;
          }
        </style>
      `;

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión");
        return;
      }

      // Escribir contenido en la ventana de impresión
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo de Venta #${venta?.id_venta}</title>
          ${printStyles}
        </head>
        <body>
          ${contenido}
        </body>
        </html>
      `);

      printWindow.document.close();

      // Imprimir después de que los recursos se hayan cargado
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    } catch (error) {
      console.error("Error al imprimir recibo:", error);
      toast.error("Ocurrió un error al preparar la impresión");
    }
  };

  // Renderizar estado de pago con un badge de color adecuado
  const renderEstadoPago = (estado: 'PENDIENTE' | 'CANCELADO' | 'PARCIAL' | 'ANULADO') => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 'CANCELADO':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cancelado</Badge>;
      case 'ANULADO':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Anulado</Badge>;
      case 'PARCIAL':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Parcial</Badge>;
      default:
        return estado;
    }
  };

  // Renderizar estado de entrega con un badge de color adecuado
  const renderEstadoEntrega = (estado: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO') => {
    switch (estado) {
      case 'NO ENTREGADO':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">No Entregado</Badge>;
      case 'PARCIAL':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Parcial</Badge>;
      case 'ENTREGADO':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entregado</Badge>;
      default:
        return estado;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-auto p-4">
        <DialogHeader>
          <DialogTitle>Detalle de Venta #{ventaId}</DialogTitle>
          <DialogDescription>
            Información completa de la venta seleccionada
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : !venta ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron datos de esta venta.</p>
          </div>
        ) : (
          <div id="ticket-imprimir">
            {/* Cabecera del Ticket - Centrada */}
            <div className="text-center empresa-info">
              <h2 className="font-bold text-sm md:text-base">{empresa?.razon_social || "Empresa"}</h2>
              <p className="text-xs">RUC: {empresa?.ruc || "00000000000"}</p>
              <p className="text-xs">{empresa?.direccion || "Dirección no disponible"}</p>
            </div>

            {/* Tipo de Comprobante - Centrado */}
            <div className="text-center border-t border-b py-0 my-1 comprobante-info">
              <h3 className="font-bold text-sm md:text-lg mb-0">
                {venta.comprobante_venta && venta.comprobante_venta.length > 0 
                  ? venta.comprobante_venta[0].tipo_comprobante 
                  : "TICKET"}
              </h3>
              <p className="text-xs mb-0">
                {venta.comprobante_venta && venta.comprobante_venta.length > 0 
                  ? `${venta.comprobante_venta[0].serie} - ${venta.comprobante_venta[0].numero}`
                  : "Sin comprobante"}
              </p>
              {/* Fecha centrada debajo de la numeración */}
              <p className="text-xs mb-0 fecha-info">
                {(() => {
                  const fechaVenta = venta.fecha_venta || venta.fecha;
                  if (fechaVenta) {
                    try {
                      return formatDate(fechaVenta);
                    } catch (e) {
                      return "Fecha inválida";
                    }
                  }
                  return "Sin fecha";
                })()}
              </p>
            </div>

            {/* Información del Cliente - Con línea delgada */}
            <div className="space-y-1 md:space-y-2 text-xs border-b py-1 cliente-info">
              {venta.cliente && (
                <>
                  <div className="flex justify-between">
                    <span className="font-semibold">Cliente:</span>
                    <span>{venta.cliente.nombres_apellidos || venta.cliente.razon_social || "Cliente Varios"}</span>
                  </div>
                  {venta.cliente.dni && (
                    <div className="flex justify-between">
                      <span className="font-semibold">DNI:</span>
                      <span>{venta.cliente.dni}</span>
                    </div>
                  )}
                  {venta.cliente.ruc && (
                    <div className="flex justify-between">
                      <span className="font-semibold">RUC:</span>
                      <span>{venta.cliente.ruc}</span>
                    </div>
                  )}
                  {venta.cliente.direccion && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Dirección:</span>
                      <span>{venta.cliente.direccion}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between">
                <span className="font-semibold">Forma de Pago:</span>
                <span>{venta.forma_pago || "EFECTIVO"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Estado de Pago:</span>
                <span>{renderEstadoPago(venta.estado_pago)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-semibold">Estado de Entrega:</span>
                <span>{renderEstadoEntrega(venta.estado_entrega)}</span>
              </div>
            </div>

            <div className="border-t border-b py-2 my-2 productos-section">
              <h4 className="font-bold text-sm text-center mb-1 section-title">DETALLE DE PRODUCTOS</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-semibold">Producto</th>
                    <th className="text-right py-1 font-semibold">Cant.</th>
                    <th className="text-right py-1 font-semibold">Precio</th>
                    <th className="text-right py-1 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(venta.detalles || venta.detalle_venta || []).map((detalle, index) => (
                    <tr key={index} className="border-b border-dashed product-row">
                      <td className="py-1">{detalle.nombre_producto || (detalle.producto ? detalle.producto.nombre : 'Producto')}</td>
                      <td className="text-right py-1">{detalle.cantidad}</td>
                      <td className="text-right py-1">S/ {parseFloat(detalle.precio_unitario.toString()).toFixed(2)}</td>
                      <td className="text-right py-1">S/ {parseFloat(detalle.subtotal.toString()).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Servicios */}
            {venta.servicio_venta && venta.servicio_venta.length > 0 && venta.servicio_venta[0] && (
              venta.servicio_venta[0].requiere_flete || venta.servicio_venta[0].requiere_descarga
            ) && (
              <div className="mb-2 servicios-section">
                <h4 className="font-bold text-sm text-center mb-1 section-title">SERVICIOS ADICIONALES</h4>
                <table className="w-full text-xs">
                  <tbody>
                    {venta.servicio_venta[0].requiere_flete && venta.servicio_venta[0].costo_flete && (
                      <tr className="border-b border-dashed">
                        <td className="py-1 font-semibold">Flete:</td>
                        <td className="text-right py-1">S/ {parseFloat(venta.servicio_venta[0].costo_flete.toString()).toFixed(2)}</td>
                      </tr>
                    )}
                    {venta.servicio_venta[0].requiere_descarga && venta.servicio_venta[0].costo_descarga && (
                      <tr className="border-b border-dashed">
                        <td className="py-1 font-semibold">Descarga:</td>
                        <td className="text-right py-1">S/ {parseFloat(venta.servicio_venta[0].costo_descarga.toString()).toFixed(2)}</td>
                      </tr>
                    )}
                    {venta.servicio_venta[0].direccion_entrega && (
                      <tr>
                        <td colSpan={2} className="text-xs italic pt-1">
                          <span className="font-semibold">Dirección de entrega:</span> {venta.servicio_venta[0].direccion_entrega}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <Separator className="my-2" />

            {/* Totales */}
            <div className="space-y-1 totales-section">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Subtotal:</span>
                <span>S/ {parseFloat((venta.detalles || venta.detalle_venta || [])
                  .reduce((sum, detalle) => sum + Number(detalle.subtotal), 0).toString()).toFixed(2)}</span>
              </div>
              
              {venta.servicio_venta && venta.servicio_venta.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Servicios:</span>
                  <span>S/ {(() => {
                    const costoFlete = venta.servicio_venta[0].costo_flete ? Number(venta.servicio_venta[0].costo_flete) : 0;
                    const costoDescarga = venta.servicio_venta[0].costo_descarga ? Number(venta.servicio_venta[0].costo_descarga) : 0;
                    return (costoFlete + costoDescarga).toFixed(2);
                  })()}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold border-t border-dashed pt-1 text-base total-item">
                <span>TOTAL:</span>
                <span>S/ {parseFloat(venta.total.toString()).toFixed(2)}</span>
              </div>
              
              {(venta.saldo_pendiente && Number(venta.saldo_pendiente) > 0) && (
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span className="text-red-600">Saldo Pendiente:</span>
                  <span className="text-red-600">S/ {parseFloat(venta.saldo_pendiente.toString()).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Observaciones */}
            {venta.observaciones && (
              <div className="mt-3 border-t pt-2 observaciones-section">
                <h4 className="font-bold text-sm">Observaciones:</h4>
                <p className="text-xs mt-1">{venta.observaciones}</p>
              </div>
            )}
            
            {/* Mensaje de agradecimiento */}
            <div className="text-center mt-4 mb-2 text-xs border-t pt-2 agradecimiento-section">
              <p className="font-semibold text-center">¡Gracias por su compra!</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={imprimirTicket}
            disabled={isLoading || !venta}
            className="gap-1"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
