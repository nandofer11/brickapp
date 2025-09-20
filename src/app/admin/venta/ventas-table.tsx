"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Eye, Pencil, Plus, Trash2, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import EditarVentaModal from "@/components/modals/editar-venta-modal";
import VerDetalleVentaModal from "@/components/modals/ver-detalle-venta-modal";
import EntregaVentaModal from "@/components/modals/entrega-venta-modal";
import Pagination from "@/components/ui/pagination";
import { formatDate } from "@/utils/dateFormat";
import { formatSoles } from "@/utils/currencyFormat";

interface Venta {
  id_venta: number;
  fecha_venta?: string; // Campo opcional para adaptarse a posibles cambios
  cliente?: {
    nombres_apellidos?: string;
    razon_social?: string;
    dni?: string;
    ruc?: string;
  };
  total: number | string; // Puede ser número o cadena
  estado_pago: 'PENDIENTE' | 'CANCELADO' | 'PARCIAL' | 'ANULADO' | 'ANULADA';
  estado_entrega: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO' | 'ANULADA';
  tipo_venta: 'DIRECTA' | 'CONTRATO';
  estado_venta?: 'ACTIVA' | 'CERRADA' | 'ANULADA'; // Nuevo campo para el estado de la venta
  adelanto?: number | string; // Campo opcional, puede ser número o cadena
  saldo_pendiente?: number | string; // Campo opcional, puede ser número o cadena
  fecha?: string; // Campo alternativo para fecha
}

export default function VentasTable() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVentaId, setEditVentaId] = useState<number | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleVentaId, setDetalleVentaId] = useState<number | null>(null);
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [entregaVentaId, setEntregaVentaId] = useState<number | null>(null);
  
  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [tamañoPagina] = useState(20);
  
  useEffect(() => {
    fetchVentas(paginaActual);
  }, [paginaActual]);

  const fetchVentas = async (pagina = 1) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ventas?page=${pagina}&pageSize=${tamañoPagina}`);
      if (!res.ok) throw new Error('Error al cargar ventas');
      
      const data = await res.json();
      setVentas(data.ventas);
      setTotalPaginas(data.meta.totalPages);
      setTotalItems(data.meta.totalItems);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar el listado de ventas');
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para las acciones de los botones
  const verDetalles = (venta: Venta) => {
    console.log("Ver detalles de venta:", venta);
    setDetalleVentaId(venta.id_venta);
    setShowDetalleModal(true);
  };

  const editarVenta = (venta: Venta) => {
    console.log("Editar venta:", venta);
    setEditVentaId(venta.id_venta);
    setShowEditModal(true);
  };

  const agregarEntrega = (venta: Venta) => {
    console.log("Agregar entrega a venta:", venta);
    setEntregaVentaId(venta.id_venta);
    setShowEntregaModal(true);
  };

  const confirmarAnular = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setShowDeleteDialog(true);
  };

  const eliminarVenta = async () => {
    if (!ventaSeleccionada) return;
    
    try {
      const res = await fetch(`/api/ventas/${ventaSeleccionada.id_venta}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Error al anular la venta');
      
      const data = await res.json();
      toast.success('Venta anulada correctamente');
      
      // Recargar las ventas desde el servidor para mantener la lista actualizada
      fetchVentas(paginaActual);
    } catch (error) {
      console.error('Error al anular venta:', error);
      toast.error('Error al anular la venta');
    } finally {
      setShowDeleteDialog(false);
      setVentaSeleccionada(null);
    }
  };

  // Función para mostrar el estado de pago con un badge de color adecuado
  const renderEstadoPago = (estado: 'PENDIENTE' | 'CANCELADO' |'PARCIAL'| 'ANULADO' | 'ANULADA') => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 'CANCELADO':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cancelado</Badge>;
      case 'ANULADO':
      case 'ANULADA':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Anulado</Badge>;
      case 'PARCIAL':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Parcial</Badge>;
      default:
        return estado;
    }
  };

  // Función para mostrar el estado de entrega con un badge de color adecuado
  const renderEstadoEntrega = (estado: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO' | 'ANULADA') => {
    switch (estado) {
      case 'NO ENTREGADO':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">No Entregado</Badge>;
      case 'PARCIAL':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Parcial</Badge>;
      case 'ENTREGADO':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entregado</Badge>;
      case 'ANULADA':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Anulada</Badge>;
      default:
        return estado;
    }
  };

  // Función para mostrar el estado de la venta con un badge de color adecuado
  const renderEstadoVenta = (estado?: 'ACTIVA' | 'CERRADA' | 'ANULADA') => {
    switch (estado) {
      case 'ACTIVA':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Activa</Badge>;
      case 'CERRADA':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cerrada</Badge>;
      case 'ANULADA':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Anulada</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Activa</Badge>;
    }
  };

  // Filtrar ventas según el texto de búsqueda y estado anulado
  const ventasFiltradas = ventas.filter(venta => {
    // Filtro por estado anulado
    if (!mostrarAnuladas && (venta.estado_venta === 'ANULADA' || venta.estado_pago === 'ANULADA' || venta.estado_entrega === 'ANULADA')) {
      return false;
    }
    
    // Filtro por texto de búsqueda
    const searchText = filtro.toLowerCase();
    const clienteInfo = venta.cliente ? 
      `${venta.cliente.nombres_apellidos || ''} ${venta.cliente.razon_social || ''} ${venta.cliente.dni || ''} ${venta.cliente.ruc || ''}`.toLowerCase() : '';
    
    return (
      clienteInfo.includes(searchText) ||
      venta.id_venta.toString().includes(searchText) ||
      venta.tipo_venta.toLowerCase().includes(searchText) ||
      venta.estado_pago.toLowerCase().includes(searchText) ||
      venta.estado_entrega.toLowerCase().includes(searchText)
    );
  });

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle>Listado de Ventas</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">
                Consulte todas las ventas registradas en el sistema.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar venta..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="text-xs md:text-sm"
              />
              <Button
                variant={mostrarAnuladas ? "default" : "outline"}
                size="sm"
                onClick={() => setMostrarAnuladas(!mostrarAnuladas)}
                className={`flex items-center gap-2 whitespace-nowrap text-xs ${
                  mostrarAnuladas 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'hover:bg-red-50 hover:text-red-700 border-red-200'
                }`}
              >
                {mostrarAnuladas ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Ocultar Anuladas
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Ver Anuladas
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Skeleton loader
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay ventas registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  Lista de {ventasFiltradas.length} ventas{!mostrarAnuladas ? " (ventas anuladas ocultas)" : " (incluyendo anuladas)"}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead>Estado Entrega</TableHead>
                    <TableHead>Estado Venta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {ventasFiltradas.map((venta) => (
                  <TableRow key={venta.id_venta}>
                    <TableCell className="font-medium">{venta.id_venta}</TableCell>
                    <TableCell>
                      {(() => {
                        const fechaVenta = venta.fecha_venta || venta.fecha;
                        if (fechaVenta) {
                          try {
                            // Usar formatDate de dateFormat.ts para manejar correctamente la zona horaria
                            return formatDate(fechaVenta);
                          } catch (e) {
                            return "Fecha inválida";
                          }
                        }
                        return "Sin fecha";
                      })()}
                    </TableCell>
                    <TableCell>
                      {venta.cliente ? (
                        <div>
                          <div className="font-medium truncate max-w-[250px]">
                            {venta.cliente.nombres_apellidos || venta.cliente.razon_social || "Cliente Varios"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {venta.cliente.dni || venta.cliente.ruc || ""}
                          </div>
                        </div>
                      ) : (
                        "Cliente Varios"
                      )}
                    </TableCell>
                    <TableCell>{venta.tipo_venta}</TableCell>
                    <TableCell className="text-right font-medium">{formatSoles(venta.total)}</TableCell>
                    <TableCell>{renderEstadoPago(venta.estado_pago)}</TableCell>
                    <TableCell>{renderEstadoEntrega(venta.estado_entrega)}</TableCell>
                    <TableCell>{renderEstadoVenta(venta.estado_venta)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Ver detalles"
                          onClick={() => verDetalles(venta)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Editar venta"
                          onClick={() => editarVenta(venta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Agregar entrega"
                          onClick={() => agregarEntrega(venta)}
                          disabled={venta.estado_venta === 'ANULADA' || venta.estado_venta === 'CERRADA'}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {venta.estado_venta !== 'ANULADA' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-accent hover:bg-destructive" 
                            title="Anular venta"
                            onClick={() => confirmarAnular(venta)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Paginación */}
            <Pagination 
              currentPage={paginaActual}
              totalPages={totalPaginas}
              onPageChange={(page) => setPaginaActual(page)}
            />
            
            {/* Mostrar info de paginación */}
            <div className="text-sm text-muted-foreground text-center mt-2 mb-4">
              Mostrando {ventas.length} de {totalItems} ventas | Página {paginaActual} de {totalPaginas}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Diálogo de confirmación para eliminar/anular venta */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción anulará la venta #{ventaSeleccionada?.id_venta} 
              {ventaSeleccionada?.cliente?.nombres_apellidos && 
                ` de ${ventaSeleccionada?.cliente?.nombres_apellidos}`}. 
              Una venta anulada no podrá ser utilizada para entregas o pagos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminarVenta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal para editar venta */}
      <EditarVentaModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditVentaId(null);
        }}
        ventaId={editVentaId}
        onVentaActualizada={() => fetchVentas(paginaActual)}
      />

      {/* Modal para ver detalle de venta */}
      <VerDetalleVentaModal
        isOpen={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setDetalleVentaId(null);
        }}
        ventaId={detalleVentaId}
      />

      {/* Modal para registrar entrega de venta */}
      <EntregaVentaModal
        isOpen={showEntregaModal}
        onClose={() => {
          setShowEntregaModal(false);
          setEntregaVentaId(null);
        }}
        ventaId={entregaVentaId}
        onEntregaRegistrada={() => fetchVentas(paginaActual)}
      />
    </>
  );
}
