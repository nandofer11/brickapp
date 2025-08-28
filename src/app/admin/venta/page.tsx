"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext"; // Añadir esta importación
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserSearch, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

// Interfaces
interface Servicio {
  requiere_flete: boolean;
  requiere_descarga: boolean;
  direccion_entrega: string;
  coste_flete: number;
  coste_descarga: number;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
}

interface Producto {
  id_producto: number;
  nombre: string;
  precio_unitario: string;
  peso: string;
  dimensiones: string;
  estado: number;
  categoria: Categoria;
}

interface ProductoSeleccionado extends Producto {
  cantidad: number;
  unidad: "unidad" | "millar";
  precioTotal: number;
}

interface Servicio {
  requiere_flete: boolean;
  requiere_descarga: boolean;
  direccion_entrega: string;
  coste_flete: number;
  coste_descarga: number;
}

interface Cliente {
  id_cliente: number;
  tipo_cliente: string;
  dni: string | null;
  ruc: string | null;
  nombres_apellidos: string | null;
  razon_social: string | null;
  direccion: string | null;
  celular: string | null;
}

interface ComprobanteVenta {
  tipo: 'TICKET' | 'BOLETA' | 'FACTURA';
  serie: string;
  numero: string;
}

interface EmpresaInfo {
  nombre: string;
  ruc: string;
  direccion: string;
}

// Definición de la interfaz para el comprobante
interface NumeracionComprobante {
  id_numeracion_comprobante: number;
  id_empresa: number;
  tipo_comprobante: string;
  serie: string;
  numero_actual: number;
}

export default function VentaPage() {
  const { empresa, user } = useAuthContext(); // Obtener la información de la empresa y usuario del contexto
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Muro");
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [modalProducto, setModalProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidad, setUnidad] = useState<"unidad" | "millar">("unidad");

  const [modalCliente, setModalCliente] = useState<boolean>(false);
  const [clienteVarios, setClienteVarios] = useState<boolean>(false);

  const [modalServicios, setModalServicios] = useState<boolean>(false);
  const [direccion, setDireccion] = useState<string>("");
  const [incluyeFlete, setIncluyeFlete] = useState<boolean>(false);
  const [montoServicio, setMontoServicio] = useState<number>(0);
  const [servicio, setServicio] = useState<Servicio | null>({
    requiere_flete: false,
    requiere_descarga: false,
    direccion_entrega: '',
    coste_flete: 0,
    coste_descarga: 0
  });

  // Estados para los nuevos campos del modelo venta
  const [tipoVenta, setTipoVenta] = useState<'DIRECTA' | 'CONTRATO'>('DIRECTA');
  // const [estadoPago, setEstadoPago] = useState<'PENDIENTE' | 'PAGADO' | 'ANULADO'>('PENDIENTE');
  const [estadoEntrega, setEstadoEntrega] = useState<'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO'>('NO ENTREGADO');
  const [adelanto, setAdelanto] = useState<number>(0);
  const [saldoPendiente, setSaldoPendiente] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>('');
  const [showObservacionesModal, setShowObservacionesModal] = useState<boolean>(false);
  
  // Estado para controlar la visibilidad del modal de ticket en dispositivos móviles
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  
  // Estado para manejar las tabs de la página
  const [activeTab, setActiveTab] = useState<'registrar' | 'listado'>('registrar');

  // Estados para comprobantes
  const [comprobantes, setComprobantes] = useState<NumeracionComprobante[]>([]);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<NumeracionComprobante | null>(null);
  const [serie, setSerie] = useState("");
  const [numero, setNumero] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteVenta>({
    tipo: 'TICKET', // Cambiado de 'BOLETA' a 'TICKET'
    serie: '001',
    numero: '000000'
  });
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE'>('EFECTIVO');
  const [estadoPago, setEstadoPago] = useState<'PENDIENTE' | 'CANCELADO' | 'PARCIAL' | 'ANULADO'>('PENDIENTE');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [searchProducto, setSearchProducto] = useState('');

  const [modalClienteTab, setModalClienteTab] = useState<'buscar' | 'nuevo'>('buscar');
  const [clientesPaginados, setClientesPaginados] = useState<Cliente[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [searchDni, setSearchDni] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    tipo_cliente: 'NATURAL',
    dni: '',
    ruc: '',
    nombres_apellidos: '',
    razon_social: '',
    direccion: '',
    celular: ''
  });

  const [fecha, setFecha] = useState<Date>(new Date());
  const [activarFlete, setActivarFlete] = useState(false);
  const [activarDescarga, setActivarDescarga] = useState(false);
  
  // Estado para almacenar el listado de ventas
  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState<boolean>(false);

  useEffect(() => {
    fetchCategorias();
    fetchProductos();
    fetchClientes();
    
    // Si la tab activa es "listado", cargar las ventas
    if (activeTab === 'listado') {
      fetchVentas();
    }
  }, []);
  
  // Cargar listado de ventas al cambiar a la tab de listado
  useEffect(() => {
    if (activeTab === 'listado') {
      fetchVentas();
    }
  }, [activeTab]);

  // Actualizar categoría seleccionada cuando se cargan las categorías
  useEffect(() => {
    if (categorias.length > 0) {
      setCategoriaSeleccionada(categorias[0].id_categoria.toString());
    }
  }, [categorias]);

  // Cargar comprobantes al iniciar el componente
  useEffect(() => {
    const cargarComprobantes = async () => {
      try {
        const response = await axios.get('/api/numeracion_comprobante');
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setComprobantes(data);

        // Seleccionar el primer comprobante por defecto si existe
        if (data.length > 0) {
          seleccionarComprobante(data[0]);
        }
      } catch (error) {
        console.error("Error al cargar comprobantes:", error);
      }
    };

    cargarComprobantes();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/productos?type=categorias');
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes?page=1&limit=10');
      const data = await res.json();
      if (data && data.clientes) {
        // Buscar cliente genérico
        const clienteGenerico = data.clientes.find((cliente: any) => 
          cliente.nombres_apellidos === 'CLIENTE GENERICO' || 
          cliente.razon_social === 'CLIENTE GENERICO'
        );
        
        let clientesOrdenados = [...data.clientes];
        
        // Si existe cliente genérico, colocarlo al inicio
        if (clienteGenerico) {
          clientesOrdenados = [
            clienteGenerico,
            ...clientesOrdenados.filter((cliente: any) => 
              (cliente.nombres_apellidos !== 'CLIENTE GENERICO' && 
               cliente.razon_social !== 'CLIENTE GENERICO')
            )
          ];
        }
        
        setClientesPaginados(clientesOrdenados);
        setTotalPaginas(data.totalPaginas);
      } else {
        setClientesPaginados([]);
        setTotalPaginas(1);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
      setClientesPaginados([]);
    }
  };

  const buscarClientePorDni = async (dni: string) => {
    try {
      const res = await fetch(`/api/clientes?dni=${dni}&page=${paginaActual}`);
      const data = await res.json();
      
      // Función para ordenar resultados con CLIENTE GENERICO primero
      const ordenarResultados = (clientes: any[]) => {
        const clienteGenerico = clientes.find((cliente: any) => 
          cliente.nombres_apellidos === 'CLIENTE GENERICO' || 
          cliente.razon_social === 'CLIENTE GENERICO'
        );
        
        if (clienteGenerico) {
          return [
            clienteGenerico,
            ...clientes.filter((cliente: any) => 
              (cliente.nombres_apellidos !== 'CLIENTE GENERICO' && 
               cliente.razon_social !== 'CLIENTE GENERICO')
            )
          ];
        }
        
        return clientes;
      };
      
      if (data && Array.isArray(data)) {
        // Si la respuesta es un array directo de clientes
        const clientesOrdenados = ordenarResultados(data);
        setClientesPaginados(clientesOrdenados);
        setTotalPaginas(Math.ceil(data.length / 10));
      } else if (data && data.clientes) {
        // Si la respuesta tiene la estructura {clientes, totalPaginas}
        const clientesOrdenados = ordenarResultados(data.clientes);
        setClientesPaginados(clientesOrdenados);
        setTotalPaginas(data.totalPaginas);
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      setClientesPaginados([]);
      setTotalPaginas(1);
    }
  };

  const registrarNuevoCliente = async () => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCliente)
      });

      if (!res.ok) throw new Error('Error al registrar cliente');

      const clienteRegistrado = await res.json();
      setClienteSeleccionado(clienteRegistrado);
      setShowClienteModal(false);
      toast.success('Cliente registrado correctamente');
    } catch (error) {
      toast.error('Error al registrar cliente');
    }
  };

  // Agregar esta función para validar documento utilizando el nuevo endpoint
  const validarDocumento = async (tipo: string, numero: string) => {
    try {
      if (!numero) {
        toast.error(`Debe ingresar un ${tipo === 'NATURAL' ? 'DNI' : 'RUC'}`);
        return;
      }

      // Validar longitud del documento
      if ((tipo === 'NATURAL' && numero.length !== 8) || 
          (tipo === 'JURIDICA' && numero.length !== 11)) {
        toast.error(`El ${tipo === 'NATURAL' ? 'DNI debe tener 8 dígitos' : 'RUC debe tener 11 dígitos'}`);
        return;
      }

      // Activar estado de carga
      setIsValidating(true);

      const res = await fetch('/api/validar-identidad', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "cliente", // Tipo de modelo
          numero: numero   // Número de documento
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || `Error al validar ${tipo === 'NATURAL' ? 'DNI' : 'RUC'}`);
        setIsValidating(false);
        return;
      }

      const data = await res.json();
      
      // Actualizar los datos del cliente según el tipo
      if (tipo === 'NATURAL') {
        setNuevoCliente(prev => ({
          ...prev,
          nombres_apellidos: data.nombre_completo || 
            `${data.apellido_paterno} ${data.apellido_materno} ${data.nombres}`.trim()
        }));
        toast.success("DNI validado correctamente");
      } else {
        setNuevoCliente(prev => ({
          ...prev,
          razon_social: data.razon_social,
          direccion: data.direccion !== '-' ? data.direccion : prev.direccion
        }));
        toast.success("RUC validado correctamente");
      }
      
      // Desactivar estado de carga
      setIsValidating(false);
    } catch (error) {
      console.error('Error en validación:', error);
      toast.error(`Error al validar ${tipo === 'NATURAL' ? 'DNI' : 'RUC'}`);
      setIsValidating(false);
    }
  };

  // Agregar producto al detalle de venta
  const agregarProducto = () => {
    if (!modalProducto) return;

    const productoExistente = productosSeleccionados.find(p => p.id_producto === modalProducto.id_producto);

    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + (unidad === "unidad" ? cantidad : cantidad * 1000);
      const nuevoPrecioTotal = nuevaCantidad * Number(productoExistente.precio_unitario);

      setProductosSeleccionados(productosSeleccionados.map(p =>
        p.id_producto === modalProducto.id_producto
          ? { ...p, cantidad: nuevaCantidad, precioTotal: nuevoPrecioTotal }
          : p
      ));
    } else {
      const cantidadTotal = unidad === "unidad" ? cantidad : cantidad * 1000;
      const precioTotal = cantidadTotal * Number(modalProducto.precio_unitario);

      setProductosSeleccionados([...productosSeleccionados, {
        ...modalProducto,
        cantidad: cantidadTotal,
        unidad: "unidad",
        precioTotal
      }]);
    }

    setModalProducto(null);
    setCantidad(1);
    setUnidad("unidad");
  };

  // Eliminar producto del detalle
  const eliminarProducto = (id: number) => {
    setProductosSeleccionados(productosSeleccionados.filter((p) => p.id_producto !== id));
  };

  // Guardar servicio
  const agregarServicio = () => {
    setServicio({ requiere_flete: incluyeFlete, requiere_descarga: false, direccion_entrega: direccion, coste_flete: montoServicio, coste_descarga: 0 });
    setModalServicios(false);
    setDireccion("");
    setMontoServicio(0);
  };
  
  // Función para cargar el listado de ventas
  const fetchVentas = async () => {
    try {
      setIsLoadingVentas(true);
      const res = await fetch('/api/ventas');
      if (!res.ok) throw new Error('Error al cargar ventas');
      
      const data = await res.json();
      setVentas(data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar el listado de ventas');
    } finally {
      setIsLoadingVentas(false);
    }
  };

  const handleConfirmarVenta = async () => {
    try {
      if (!clienteSeleccionado && !clienteVarios) {
        toast.error('Debe seleccionar un cliente');
        return;
      }

      if (productosSeleccionados.length === 0) {
        toast.error('Debe agregar productos a la venta');
        return;
      }

      // Validación para servicios de flete
      if (activarFlete) {
        if (!clienteSeleccionado?.celular) {
          toast.error('Debe ingresar un número de celular para el servicio de flete');
          return;
        }
        if (!servicio?.direccion_entrega) {
          toast.error('Debe ingresar una dirección de entrega para el servicio de flete');
          return;
        }
        if (!servicio?.coste_flete) {
          toast.error('Debe ingresar un costo para el servicio de flete');
          return;
        }
      }

      // Validación para servicio de descarga
      if (activarDescarga && !servicio?.coste_descarga) {
        toast.error('Debe ingresar un costo para el servicio de descarga');
        return;
      }

      const ventaData = {
        cliente_id: clienteSeleccionado?.id_cliente,
        comprobante: {
          tipo_comprobante: comprobanteSeleccionado?.tipo_comprobante || "TICKET",
          serie: comprobanteSeleccionado?.serie || "001",
          numero: comprobanteSeleccionado?.numero_actual?.toString().padStart(6, '0') || "000000",
          fecha: fecha,
          forma_pago: formaPago || "EFECTIVO",
          id_usuario: user?.id || 1,
          estado_entrega: estadoEntrega,
          tipo_venta: tipoVenta
        },
        productos: productosSeleccionados.map(p => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          subtotal: p.precioTotal
        })),
        servicios: (() => {
          const serviciosArray = [];
          
          // Agregar servicio de flete si está activado
          if (activarFlete) {
            serviciosArray.push({
              tipo: 'flete',
              monto: servicio?.coste_flete || 0,
              direccion_entrega: servicio?.direccion_entrega || ''
            });
          }
          
          // Agregar servicio de descarga si está activado
          if (activarDescarga) {
            serviciosArray.push({
              tipo: 'descarga',
              monto: servicio?.coste_descarga || 0
            });
          }
          
          return serviciosArray;
        })(),
        total,
        tipo_venta: tipoVenta,
        estado_pago: estadoPago,
        estado_entrega: estadoEntrega,
        adelanto: adelanto,
        saldo_pendiente: saldoPendiente,
        observaciones: observaciones
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Error al registrar la venta' }));
        throw new Error(errorData.message || 'Error al registrar la venta');
      }

      toast.success('Venta registrada correctamente');
      // Recargar la lista de ventas si estamos en modo listado
      if (activeTab === 'listado') {
        fetchVentas();
      }
      // Limpiar formulario
      setProductosSeleccionados([]);
      setClienteSeleccionado(null);
      setServicio(null);
      setClienteVarios(false);
      // Reiniciar los nuevos campos
      setTipoVenta('DIRECTA');
      setEstadoPago('PENDIENTE');
      setEstadoEntrega('NO ENTREGADO');
      setAdelanto(0);
      setSaldoPendiente(0);
      setObservaciones('');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar la venta');
    }
  };

  // Calcular totales
  const subtotal = productosSeleccionados.reduce((sum, p) => sum + p.precioTotal, 0);
  const costoServicios = (servicio ? (servicio.coste_flete + servicio.coste_descarga) : 0);
  const total = subtotal + costoServicios;

  // Actualizar saldo pendiente cuando cambia el total
  useEffect(() => {
    setSaldoPendiente(total - adelanto);
  }, [total, adelanto]);

  // Efecto para manejar cuando cambia el estado de pago
  useEffect(() => {
    if (estadoPago === 'CANCELADO') {
      // Si está pagado/cancelado, el adelanto debe ser igual al total y el saldo pendiente 0
      setAdelanto(total);
      setSaldoPendiente(0);
    } else if (estadoPago === 'PENDIENTE' || estadoPago === 'PARCIAL') {
      // Si está pendiente o parcial, actualizar el saldo pendiente
      setSaldoPendiente(total);
      setAdelanto(0);
    }
  }, [estadoPago, total]);

  // Función para seleccionar un comprobante
  const seleccionarComprobante = (comprobante: NumeracionComprobante) => {
    setComprobanteSeleccionado(comprobante);
    setSerie(comprobante.serie);
    setNumero((comprobante.numero_actual + 1).toString());
  };

  // Función para renderizar el contenido del ticket (reutilizable para desktop y modal)
  const renderContenidoTicket = () => {
    return (
      <>
        {/* Cabecera del Ticket */}
        <div className="text-center space-y-1">
          <h2 className="font-bold text-sm md:text-base">{empresa?.razon_social || "Empresa"}</h2>
          <p className="text-xs">RUC: {empresa?.ruc || "00000000000"}</p>
          <p className="text-xs">{empresa?.direccion || "Dirección no disponible"}</p>
        </div>

        {/* Tipo de Comprobante */}
        <div className="text-center border-t border-b py-1 md:py-2">
          <h3 className="font-bold text-sm md:text-lg">{comprobanteSeleccionado?.tipo_comprobante || "TICKET"}</h3>
          <p className="text-xs">
            {serie} - {numero}
          </p>
        </div>

        {/* Información de la Venta */}
        <div className="space-y-1 md:space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{format(fecha, "dd/MM/yyyy")}</span>
          </div>
          {clienteSeleccionado && (
            <>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="text-right flex-1 ml-2">{clienteSeleccionado.nombres_apellidos || clienteSeleccionado.razon_social}</span>
              </div>
              <div className="flex justify-between">
                <span>{clienteSeleccionado.dni ? 'DNI:' : 'RUC:'}</span>
                <span>{clienteSeleccionado.dni || clienteSeleccionado.ruc}</span>
              </div>
            </>
          )}
        </div>

        {/* Tabla de Productos */}
        <div className="border-t pt-1 md:pt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] md:text-xs">
                <th className="text-left">Producto</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">P.U</th>
                <th className="text-right">Imp.</th>
                <th className="w-6 md:w-8"></th>
              </tr>
            </thead>
            <tbody>
              {productosSeleccionados.map((p) => (
                <tr key={p.id_producto} className="border-b">
                  <td className="py-1 max-w-[100px]">
                    <div className="truncate">{p.nombre}</div>
                  </td>
                  <td className="text-right">{p.cantidad}</td>
                  <td className="text-right">{Number(p.precio_unitario).toFixed(2)}</td>
                  <td className="text-right">{p.precioTotal.toFixed(2)}</td>
                  <td className="pl-1 md:pl-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 md:h-6 md:w-6 text-destructive hover:text-destructive p-0"
                      onClick={() => eliminarProducto(p.id_producto)}
                    >
                      
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Servicios Seleccionados */}
        {servicio && (servicio.requiere_flete || servicio.requiere_descarga) && (
          <div className="space-y-1 text-xs border-t pt-1 md:pt-2">
            <h3 className="font-medium">Servicios:</h3>
            {servicio.requiere_flete && (
              <div className="flex justify-between">
                <span>Flete</span>
                <span>S/ {servicio.coste_flete.toFixed(2)}</span>
              </div>
            )}
            {servicio.requiere_descarga && (
              <div className="flex justify-between">
                <span>Descarga</span>
                <span>S/ {servicio.coste_descarga.toFixed(2)}</span>
              </div>
            )}
            {servicio.direccion_entrega && (
              <p className="text-xs text-muted-foreground">
                Entregar en: {servicio.direccion_entrega}
              </p>
            )}
            {activarFlete && clienteSeleccionado?.celular && (
              <p className="text-xs text-muted-foreground">
                Contacto: {clienteSeleccionado.celular}
              </p>
            )}
          </div>
        )}

        {/* Información de Pago */}
        <div className="space-y-1 text-xs border-t pt-1 md:pt-2">
          <h3 className="font-medium">Información de Pago:</h3>
          <div className="flex justify-between">
            <span>Forma de Pago:</span>
            <span>{formaPago}</span>
          </div>
          <div className="flex justify-between">
            <span>Estado de Pago:</span>
            <span>{estadoPago}</span>
          </div>
        </div>

        {/* Totales */}
        <div className="space-y-1 text-xs border-t pt-1 md:pt-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Servicios:</span>
            <span>S/ {costoServicios.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm md:text-lg mt-1 md:mt-2">
            <span>Total:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full text-xs md:text-sm mt-2" 
          size="sm" 
          onClick={handleConfirmarVenta}
        >
          Confirmar Venta
        </Button>
      </>
    );
  };

  return (
    <div className="container mx-auto p-2 md:p-4 relative">
      {/* Tabs para alternar entre registro y listado */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'registrar' | 'listado')}
        className="mb-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registrar">Registrar Venta</TabsTrigger>
          <TabsTrigger value="listado">Listado de Ventas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrar">
          {/* Vista móvil: Stack vertical, Vista desktop: Grid de 3 columnas */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-4">
        {/* Panel Izquierdo: Formulario de Venta */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm mb-16 lg:mb-0">
            <CardHeader className="pb-2 md:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <CardTitle className="text-xl">Venta</CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Registre los productos y servicios para la venta.
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[180px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(fecha, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(date) => date && setFecha(date)}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              {/* Tipo de Venta y Comprobante en una sola fila para pantallas grandes */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                {/* Tipo de Venta */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:w-1/3">
                  <Label className="w-full sm:w-32 lg:w-auto">Tipo de Venta</Label>
                  <div className="flex-1">
                    <Select 
                      value={tipoVenta} 
                      onValueChange={(value: 'DIRECTA' | 'CONTRATO') => setTipoVenta(value)}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Tipo de Venta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIRECTA">Directa</SelectItem>
                        <SelectItem value="CONTRATO">Contrato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Comprobante */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 lg:mt-0 lg:w-2/3">
                  <Label className="w-full sm:w-32 lg:w-auto">Comprobante</Label>
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Select value={comprobanteSeleccionado?.id_numeracion_comprobante.toString() || ""} onValueChange={(value) => {
                      const id = parseInt(value);
                      const comprobante = comprobantes.find(c => c.id_numeracion_comprobante === id);
                      if (comprobante) {
                        seleccionarComprobante(comprobante);
                      }
                    }}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Seleccionar comprobante" />
                      </SelectTrigger>
                      <SelectContent>
                        {comprobantes.map(comp => (
                          <SelectItem
                            key={comp.id_numeracion_comprobante}
                            value={comp.id_numeracion_comprobante.toString()}
                          >
                            {comp.tipo_comprobante}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Serie y Número como inputs normales */}
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                      <div>
                        <Input
                          id="serie"
                          type="text"
                          value={serie}
                          readOnly
                          className="bg-gray-50 text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          id="numero"
                          type="text"
                          value={numero}
                          readOnly
                          className="bg-gray-50 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cliente con input deshabilitado y botón de búsqueda */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <Label className="w-full sm:w-32">Cliente</Label>
                <div className="flex-1">
                  <div className="flex gap-2 items-center">
                    <Input
                      className="bg-gray-50 text-sm"
                      disabled
                      value={clienteSeleccionado ? 
                        `${clienteSeleccionado.dni || clienteSeleccionado.ruc || ''} - ${clienteSeleccionado.nombres_apellidos || clienteSeleccionado.razon_social || ''}` 
                        : ''}
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowClienteModal(true)}>
                      <UserSearch className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Buscar</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-3 md:space-y-4">
                {/* Comentado según solicitud
                <Input
                  placeholder="Buscar producto por nombre..."
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                  className="text-xs md:text-sm"
                />
                */}
                <Tabs value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada} className="w-full">
                  <ScrollArea className="w-full max-w-full pb-2">
                    <TabsList className="w-max justify-start inline-flex">
                      {categorias.map((cat) => (
                        <TabsTrigger 
                          key={cat.id_categoria} 
                          value={cat.id_categoria.toString()}
                          className="text-xs md:text-sm"
                        >
                          {cat.nombre}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </ScrollArea>
                  {categorias.map((cat) => (
                    <TabsContent key={cat.id_categoria} value={cat.id_categoria.toString()} className="mt-2 md:mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {productos
                          .filter((p) => p.categoria.id_categoria === cat.id_categoria)
                          .map((p) => (
                            <Button
                              key={p.id_producto}
                              variant="outline"
                              className={`h-16 md:h-20 flex flex-col py-1 px-2 text-xs md:text-sm ${
                                productosSeleccionados.some(ps => ps.id_producto === p.id_producto) 
                                ? "bg-green-50 border-green-200" 
                                : ""
                              }`}
                              onClick={() => setModalProducto(p)}
                            >
                              <span className="font-bold line-clamp-1">{p.nombre}</span>
                              <span>S/ {Number(p.precio_unitario).toFixed(2)}</span>
                            </Button>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <Separator className="my-2 md:my-4" />

              {/* Servicios */}
              <div className="space-y-2 md:space-y-3">
                <Label>Servicios</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flete"
                      checked={activarFlete}
                      onCheckedChange={(checked) => {
                        setActivarFlete(!!checked);
                        setServicio(prev => ({ 
                          ...prev!, 
                          requiere_flete: !!checked,
                          // Si se desactiva, reseteamos los valores relacionados
                          ...((!checked) ? {
                            direccion_entrega: '',
                            coste_flete: 0
                          } : {})
                        }));
                      }}
                    />
                    <Label htmlFor="flete" className="w-12 text-sm">Flete</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="descarga"
                      checked={activarDescarga}
                      onCheckedChange={(checked) => {
                        setActivarDescarga(!!checked);
                        setServicio(prev => ({ 
                          ...prev!, 
                          requiere_descarga: !!checked,
                          // Si se desactiva, reseteamos el costo de descarga
                          ...((!checked) ? {
                            coste_descarga: 0
                          } : {})
                        }));
                      }}
                    />
                    <Label htmlFor="descarga" className="w-16 text-sm">Descarga</Label>
                  </div>
                </div>
                
                {/* Grid para campos de servicio */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Input de celular */}
                  <Input
                    placeholder="Celular"
                    className={`text-xs ${!activarFlete ? "bg-gray-100" : ""}`}
                    disabled={!activarFlete}
                    value={activarFlete ? (clienteSeleccionado?.celular || '') : ''}
                    onChange={(e) => {
                      // Solo permitir 9 dígitos
                      const value = e.target.value.replace(/\D/g, '').substring(0, 9);
                      
                      // Si se está usando, permitimos la edición directa
                      if (clienteSeleccionado) {
                        // Crear una copia actualizada del cliente seleccionado con el nuevo celular
                        setClienteSeleccionado({
                          ...clienteSeleccionado,
                          celular: value
                        });
                      }
                    }}
                    required={activarFlete}
                  />
                  
                  {/* Costo de flete */}
                  <Input
                    placeholder="Costo de flete"
                    className={`text-xs ${!activarFlete ? "bg-gray-100" : ""}`}
                    disabled={!activarFlete}
                    type="number"
                    value={activarFlete ? (servicio?.coste_flete || '') : ''}
                    onChange={(e) =>
                      setServicio(prev => ({ ...prev!, coste_flete: Number(e.target.value) }))
                    }
                    required={activarFlete}
                  />
                </div>
                
                {/* Dirección condicionada por flete */}
                <Input
                  placeholder="Dirección de entrega"
                  className={`text-xs ${!activarFlete ? "bg-gray-100" : ""}`}
                  disabled={!activarFlete}
                  value={activarFlete ? (servicio?.direccion_entrega || '') : ''}
                  onChange={(e) =>
                    setServicio(prev => ({ ...prev!, direccion_entrega: e.target.value }))
                  }
                  required={activarFlete}
                />
                
                {/* Costo de descarga condicionado */}
                <Input
                  placeholder="Costo de descarga"
                  className={`text-xs ${!activarDescarga ? "bg-gray-100" : ""}`}
                  disabled={!activarDescarga}
                  type="number"
                  value={activarDescarga ? (servicio?.coste_descarga || '') : ''}
                  onChange={(e) =>
                    setServicio(prev => ({ ...prev!, coste_descarga: Number(e.target.value) }))
                  }
                  required={activarDescarga}
                />
              </div>

              {/* Pagos */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Forma de Pago, Estado de Pago y Estado de Entrega en una fila para pantallas grandes */}
                <div className="col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Forma de Pago</Label>
                    <Select value={formaPago} onValueChange={(value: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE') => setFormaPago(value)}>
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                        <SelectItem value="YAPE">Yape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Estado de Pago</Label>
                    <Select 
                      value={estadoPago} 
                      onValueChange={(value: 'PENDIENTE' | 'CANCELADO' | 'PARCIAL' | 'ANULADO') => {
                        setEstadoPago(value);
                        // Actualizar adelanto y saldo pendiente según el estado seleccionado
                        if (value === 'CANCELADO') {
                          setAdelanto(total);
                          setSaldoPendiente(0);
                        } else if (value === 'PENDIENTE') {
                          setAdelanto(0);
                          setSaldoPendiente(total);
                        } else if (value === 'PARCIAL') {
                          // En caso de parcial, mantener el adelanto actual y recalcular saldo
                          const saldo = total - adelanto;
                          setSaldoPendiente(saldo >= 0 ? saldo : 0);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        <SelectItem value="PARCIAL">Parcial</SelectItem>
                        <SelectItem value="ANULADO">Anulado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Estado de Entrega</Label>
                    <Select 
                      value={estadoEntrega} 
                      onValueChange={(value: 'NO ENTREGADO' | 'PARCIAL' | 'ENTREGADO') => setEstadoEntrega(value)}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Estado de Entrega" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO ENTREGADO">No Entregado</SelectItem>
                        <SelectItem value="PARCIAL">Parcial</SelectItem>
                        <SelectItem value="ENTREGADO">Entregado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-3 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Adelanto (S/.)</Label>
                    <Input 
                      type="number" 
                      value={estadoPago === 'CANCELADO' ? total : (estadoPago === 'PENDIENTE' ? 0 : adelanto)} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setAdelanto(value);
                        // Actualizar saldo pendiente basado en el total y adelanto
                        const saldo = parseFloat(String(total)) - value;
                        setSaldoPendiente(saldo >= 0 ? saldo : 0);
                      }} 
                      className="text-xs"
                      disabled={estadoPago === 'CANCELADO' || estadoPago === 'PENDIENTE'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Saldo Pendiente (S/.)</Label>
                    <Input 
                      type="number" 
                      value={estadoPago === 'CANCELADO' ? 0 : (estadoPago === 'PENDIENTE' ? total : saldoPendiente)} 
                      readOnly 
                      className={`text-xs bg-gray-50 ${estadoPago === 'CANCELADO' || estadoPago === 'PENDIENTE' ? 'opacity-70' : ''}`}
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Observaciones</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowObservacionesModal(true)}
                      className="text-xs h-7"
                    >
                      Editar
                    </Button>
                  </div>
                  <div className="border rounded p-2 text-xs h-16 overflow-auto bg-gray-50">
                    {observaciones || "Sin observaciones"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho: Ticket - Solo visible en desktop */}
        <div className="hidden lg:block">
          <Card className="h-full shadow-sm">
            <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
              {/* Cabecera del Ticket */}
              <div className="text-center space-y-1">
                <h2 className="font-bold text-sm md:text-base">{empresa?.razon_social || "Empresa"}</h2>
                <p className="text-xs">RUC: {empresa?.ruc || "00000000000"}</p>
                <p className="text-xs">{empresa?.direccion || "Dirección no disponible"}</p>
              </div>

              {/* Tipo de Comprobante */}
              <div className="text-center border-t border-b py-1 md:py-2">
                <h3 className="font-bold text-sm md:text-lg">{comprobanteSeleccionado?.tipo_comprobante || "TICKET"}</h3>
                <p className="text-xs">
                  {serie} - {numero}
                </p>
              </div>

              {/* Información de la Venta */}
              <div className="space-y-1 md:space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{format(fecha, "dd/MM/yyyy")}</span>
                </div>
                {clienteSeleccionado && (
                  <>
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span className="text-right flex-1 ml-2">{clienteSeleccionado.nombres_apellidos || clienteSeleccionado.razon_social}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{clienteSeleccionado.dni ? 'DNI:' : 'RUC:'}</span>
                      <span>{clienteSeleccionado.dni || clienteSeleccionado.ruc}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Tabla de Productos */}
              <div className="border-t pt-1 md:pt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] md:text-xs">
                      <th className="text-left">Producto</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">P.U</th>
                      <th className="text-right">Imp.</th>
                      <th className="w-6 md:w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosSeleccionados.map((p) => (
                      <tr key={p.id_producto} className="border-b">
                        <td className="py-1 max-w-[100px]">
                          <div className="truncate">{p.nombre}</div>
                        </td>
                        <td className="text-right">{p.cantidad}</td>
                        <td className="text-right">{Number(p.precio_unitario).toFixed(2)}</td>
                        <td className="text-right">{p.precioTotal.toFixed(2)}</td>
                        <td className="pl-1 md:pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 md:h-6 md:w-6 text-destructive hover:text-destructive p-0"
                            onClick={() => eliminarProducto(p.id_producto)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 md:h-4 md:w-4"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Servicios Seleccionados */}
              {servicio && (servicio.requiere_flete || servicio.requiere_descarga) && (
                <div className="space-y-1 text-xs border-t pt-1 md:pt-2">
                  <h3 className="font-medium">Servicios:</h3>
                  {servicio.requiere_flete && (
                    <div className="flex justify-between">
                      <span>Flete</span>
                      <span>S/ {servicio.coste_flete.toFixed(2)}</span>
                    </div>
                  )}
                  {servicio.requiere_descarga && (
                    <div className="flex justify-between">
                      <span>Descarga</span>
                      <span>S/ {servicio.coste_descarga.toFixed(2)}</span>
                    </div>
                  )}
                  {servicio.direccion_entrega && (
                    <p className="text-xs text-muted-foreground">
                      Entregar en: {servicio.direccion_entrega}
                    </p>
                  )}
                  {activarFlete && clienteSeleccionado?.celular && (
                    <p className="text-xs text-muted-foreground">
                      Contacto: {clienteSeleccionado.celular}
                    </p>
                  )}
                </div>
              )}

              {/* Información de Pago */}
              <div className="space-y-1 text-xs border-t pt-1 md:pt-2">
                <h3 className="font-medium">Información de Pago:</h3>
                <div className="flex justify-between">
                  <span>Forma de Pago:</span>
                  <span>{formaPago}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado de Pago:</span>
                  <span>{estadoPago}</span>
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-1 text-xs border-t pt-1 md:pt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Servicios:</span>
                  <span>S/ {costoServicios.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm md:text-lg mt-1 md:mt-2">
                  <span>Total:</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full text-xs md:text-sm mt-2" 
                size="sm" 
                onClick={handleConfirmarVenta}
              >
                Confirmar Venta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales existentes actualizados con componentes shadcn/ui */}
      {/* Modal Cantidad */}
      {modalProducto && (
        <Dialog open={modalProducto !== null} onOpenChange={() => setModalProducto(null)}>
          <DialogContent className="max-w-xs sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm md:text-base">
                {modalProducto.nombre}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs md:text-sm">Cantidad</Label>
                <Input 
                  type="number" 
                  value={cantidad} 
                  onChange={(e) => setCantidad(Number(e.target.value))} 
                  className="text-xs md:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs md:text-sm">Unidad</Label>
                <Select value={unidad} onValueChange={(value) => setUnidad(value as "unidad" | "millar")}>
                  <SelectTrigger className="text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="millar">Millar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full text-xs md:text-sm" onClick={agregarProducto}>
              Añadir
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Selección de Cliente */}
      <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-lg">Gestión de Cliente</DialogTitle>
          </DialogHeader>
          <Tabs value={modalClienteTab} onValueChange={(v) => setModalClienteTab(v as 'buscar' | 'nuevo')}>
            <TabsList className="grid w-full grid-cols-2 text-xs md:text-sm">
              <TabsTrigger value="buscar">Buscar Cliente</TabsTrigger>
              <TabsTrigger value="nuevo">Nuevo Cliente</TabsTrigger>
            </TabsList>
            <TabsContent value="buscar" className="space-y-2">
              <Input
                placeholder="Buscar por DNI/RUC..."
                value={searchDni}
                className="text-xs md:text-sm"
                onChange={(e) => {
                  const valor = e.target.value;
                  setSearchDni(valor);
                  // Buscar inmediatamente si hay al menos 3 caracteres
                  if (valor.length >= 3) {
                    buscarClientePorDni(valor);
                  } else if (valor.length === 0) {
                    // Si se borra todo, cargar la lista inicial
                    fetchClientes();
                  }
                }}
              />
              <ScrollArea className="h-[250px] md:h-[300px]">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="text-[10px] md:text-xs font-medium">
                      <th className="text-left p-1">DNI/RUC</th>
                      <th className="text-left p-1">Nombre/Razón Social</th>
                      <th className="text-left p-1">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(clientesPaginados) && clientesPaginados.map((cliente) => (
                      <tr
                        key={cliente.id_cliente}
                        className="border-b hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setClienteSeleccionado(cliente);
                          setShowClienteModal(false);
                        }}
                      >
                        <td className="p-1">{cliente.dni || cliente.ruc}</td>
                        <td className="p-1">
                          <div className="truncate max-w-[150px] md:max-w-[250px]">
                            {cliente.nombres_apellidos || cliente.razon_social}
                          </div>
                        </td>
                        <td className="p-1">{cliente.tipo_cliente}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  disabled={paginaActual === 1}
                  onClick={() => {
                    setPaginaActual(prev => prev - 1);
                    buscarClientePorDni(searchDni);
                  }}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => {
                    setPaginaActual(prev => prev + 1);
                    buscarClientePorDni(searchDni);
                  }}
                >
                  Siguiente
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="nuevo" className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm">Tipo Cliente</Label>
                  <Select
                    value={nuevoCliente.tipo_cliente}
                    onValueChange={(v) => setNuevoCliente({ ...nuevoCliente, tipo_cliente: v })}
                  >
                    <SelectTrigger className="text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATURAL">Natural</SelectItem>
                      <SelectItem value="JURIDICA">Jurídico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm">{nuevoCliente.tipo_cliente === 'NATURAL' ? 'DNI' : 'RUC'}</Label>
                  <div className="flex gap-2">
                    <Input
                      className="text-xs md:text-sm"
                      value={nuevoCliente.tipo_cliente === 'NATURAL' ? nuevoCliente.dni : nuevoCliente.ruc}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validar máximo 9 dígitos para DNI y solo permitir números
                        if (nuevoCliente.tipo_cliente === 'NATURAL' && (value.length > 9 || !/^\d*$/.test(value))) {
                          return;
                        }
                        setNuevoCliente({
                          ...nuevoCliente,
                          [nuevoCliente.tipo_cliente === 'NATURAL' ? 'dni' : 'ruc']: value
                        });
                      }}
                      maxLength={nuevoCliente.tipo_cliente === 'NATURAL' ? 9 : 11}
                    />
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => validarDocumento(
                        nuevoCliente.tipo_cliente,
                        nuevoCliente.tipo_cliente === 'NATURAL' ? nuevoCliente.dni : nuevoCliente.ruc
                      )}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <>
                          <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-white"></span>
                          Validando...
                        </>
                      ) : (
                        "Validar"
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <Label className="text-xs md:text-sm">{nuevoCliente.tipo_cliente === 'NATURAL' ? 'Nombres y Apellidos' : 'Razón Social'}</Label>
                  <Input
                    className="text-xs md:text-sm"
                    value={nuevoCliente.tipo_cliente === 'NATURAL' ? nuevoCliente.nombres_apellidos : nuevoCliente.razon_social}
                    onChange={(e) => setNuevoCliente({ 
                      ...nuevoCliente, 
                      [nuevoCliente.tipo_cliente === 'NATURAL' ? 'nombres_apellidos' : 'razon_social']: e.target.value 
                    })}
                    disabled={nuevoCliente.tipo_cliente === 'NATURAL' ? 
                      !!nuevoCliente.nombres_apellidos && nuevoCliente.nombres_apellidos !== '' : 
                      !!nuevoCliente.razon_social && nuevoCliente.razon_social !== ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm">Celular</Label>
                  <Input
                    className="text-xs md:text-sm"
                    value={nuevoCliente.celular}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, celular: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm">Dirección</Label>
                  <Input
                    className="text-xs md:text-sm"
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full text-xs md:text-sm" onClick={registrarNuevoCliente}>
                Registrar Cliente
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Servicios */}
      <Dialog open={modalServicios} onOpenChange={setModalServicios}>
        <DialogContent className="max-w-xs sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">Agregar Servicios</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flete"
                checked={servicio?.requiere_flete}
                onCheckedChange={(checked) =>
                  setServicio(prev => ({ ...prev!, requiere_flete: !!checked }))
                }
              />
              <Label htmlFor="flete" className="text-xs md:text-sm">Requiere Flete</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="descarga"
                checked={servicio?.requiere_descarga}
                onCheckedChange={(checked) =>
                  setServicio(prev => ({ ...prev!, requiere_descarga: !!checked }))
                }
              />
              <Label htmlFor="descarga" className="text-xs md:text-sm">Requiere Descarga</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs md:text-sm">Dirección de Entrega</Label>
              <Input
                value={servicio?.direccion_entrega || ''}
                className="text-xs md:text-sm"
                onChange={(e) =>
                  setServicio(prev => ({ ...prev!, direccion_entrega: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs md:text-sm">Coste Flete</Label>
                <Input
                  type="number"
                  className="text-xs md:text-sm"
                  value={servicio?.coste_flete || ''}
                  onChange={(e) =>
                    setServicio(prev => ({ ...prev!, coste_flete: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs md:text-sm">Coste Descarga</Label>
                <Input
                  type="number"
                  className="text-xs md:text-sm"
                  value={servicio?.coste_descarga || ''}
                  onChange={(e) =>
                    setServicio(prev => ({ ...prev!, coste_descarga: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="text-xs md:text-sm" onClick={() => setModalServicios(false)}>
              Cancelar
            </Button>
            <Button className="text-xs md:text-sm" onClick={agregarServicio}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Observaciones */}
      <Dialog open={showObservacionesModal} onOpenChange={setShowObservacionesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">Observaciones de la Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs md:text-sm">Ingrese las observaciones:</Label>
            <textarea 
              className="w-full h-32 p-2 border rounded text-xs md:text-sm"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escriba aquí las observaciones o detalles adicionales de la venta..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="text-xs md:text-sm" onClick={() => setShowObservacionesModal(false)}>
              Cancelar
            </Button>
            <Button className="text-xs md:text-sm" onClick={() => setShowObservacionesModal(false)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ticket para dispositivos móviles */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto p-4">
          <DialogHeader>
            <DialogTitle>Ticket de Venta</DialogTitle>
          </DialogHeader>
          {renderContenidoTicket()}
          <DialogFooter>
            <Button onClick={() => setShowTicketModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Botón flotante para mostrar el ticket en dispositivos móviles */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setShowTicketModal(true)} 
          className="rounded-full h-14 w-14 shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </Button>
      </div>
      </TabsContent>
      
      <TabsContent value="listado">
        <div className="w-full">
          {/* Importamos la tabla de ventas */}
          {React.createElement(dynamic(() => import('./ventas-table'), { ssr: false }))}
        </div>
      </TabsContent>
    </Tabs>
    </div>
  );
}
