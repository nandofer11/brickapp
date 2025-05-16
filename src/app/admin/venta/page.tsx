"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
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

// Interfaces
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

export default function VentaPage() {
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

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteVenta>({
    tipo: 'TICKET', // Cambiado de 'BOLETA' a 'TICKET'
    serie: '001',
    numero: '000000'
  });
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE'>('EFECTIVO');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [searchProducto, setSearchProducto] = useState('');

  const [modalClienteTab, setModalClienteTab] = useState<'buscar' | 'nuevo'>('buscar');
  const [clientesPaginados, setClientesPaginados] = useState<Cliente[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [searchDni, setSearchDni] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState({
    tipo_cliente: 'NATURAL',
    dni: '',
    ruc: '',
    nombres_apellidos: '',
    razon_social: '',
    direccion: '',
    celular: ''
  });

  const [empresaInfo] = useState<EmpresaInfo>({
    nombre: "MATERIALES & CONSTRUCCIÓN S.A.C.",
    ruc: "20450289648",
    direccion: "Av. Agricultura 123 - Moyobamba"
  });

  const [fecha, setFecha] = useState<Date>(new Date());

  useEffect(() => {
    fetchCategorias();
    fetchProductos();
    fetchClientes();
  }, []);

  // Actualizar categoría seleccionada cuando se cargan las categorías
  useEffect(() => {
    if (categorias.length > 0) {
      setCategoriaSeleccionada(categorias[0].id_categoria.toString());
    }
  }, [categorias]);

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
        setClientesPaginados(data.clientes);
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
      if (data && Array.isArray(data)) {
        // Si la respuesta es un array directo de clientes
        setClientesPaginados(data);
        setTotalPaginas(Math.ceil(data.length / 10));
      } else if (data && data.clientes) {
        // Si la respuesta tiene la estructura {clientes, totalPaginas}
        setClientesPaginados(data.clientes);
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

  // Agregar esta función para validar documento
  const validarDocumento = async (documento: string) => {
    try {
      const res = await fetch(`/api/sunat/consulta?numero=${documento}`);
      const data = await res.json();
      if (data) {
        setNuevoCliente(prev => ({
          ...prev,
          nombres_apellidos: data.nombre || '',
          razon_social: data.razonSocial || '',
        }));
      }
    } catch (error) {
      toast.error('Error al validar documento');
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

      const ventaData = {
        cliente_id: clienteSeleccionado?.id_cliente,
        comprobante,
        productos: productosSeleccionados.map(p => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          subtotal: p.precioTotal
        })),
        servicios: servicio ? [{
          descripcion: servicio.direccion_entrega,
          monto: servicio.coste_flete
        }] : [],
        total
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      if (!res.ok) throw new Error('Error al registrar la venta');

      toast.success('Venta registrada correctamente');
      // Limpiar formulario
      setProductosSeleccionados([]);
      setClienteSeleccionado(null);
      setServicio(null);
      setClienteVarios(false);
    } catch (error) {
      toast.error('Error al registrar la venta');
    }
  };

  // Calcular totales
  const subtotal = productosSeleccionados.reduce((sum, p) => sum + p.precioTotal, 0);
  const total = servicio ? subtotal + servicio.coste_flete : subtotal;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel Izquierdo: Formulario de Venta */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Venta</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Registre una nueva venta seleccionando los productos y servicios necesarios.
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
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
            <CardContent className="space-y-4">
              {/* Comprobante */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Comprobante</Label>
                <div className="flex-1 flex items-center gap-4">
                  <Select value={comprobante.tipo} onValueChange={(value: 'TICKET' | 'BOLETA' | 'FACTURA') => 
                      setComprobante({ ...comprobante, tipo: value })}>
                      <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="TICKET">Ticket</SelectItem>
                          <SelectItem value="BOLETA">Boleta</SelectItem>
                          <SelectItem value="FACTURA">Factura</SelectItem>
                      </SelectContent>
                  </Select>
                  <Input 
                    className="w-24" 
                    value={comprobante.serie} 
                    disabled 
                    placeholder="Serie"
                  />
                  <Input 
                    className="w-32" 
                    value={comprobante.numero} 
                    disabled 
                    placeholder="Número"
                  />
                </div>
              </div>

              {/* Cliente */}
              <div className="flex items-start gap-4">
                <Label className="w-32">Cliente</Label>
                <div className="flex-1">
                  <div className="flex gap-4 items-start">
                    <Button variant="outline" size="sm" onClick={() => setShowClienteModal(true)}>
                      <UserSearch className="h-4 w-4 mr-2" />
                      Buscar Cliente
                    </Button>
                    {clienteSeleccionado && (
                      <div className="flex-1 text-sm">
                        <span className="mr-2"><strong>DNI/RUC:</strong> {clienteSeleccionado.dni || clienteSeleccionado.ruc}</span>
                        <span className="mx-2">|</span>
                        <span><strong>Cliente:</strong> {clienteSeleccionado.nombres_apellidos || clienteSeleccionado.razon_social}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de Servicios y Pagos */}
              <div className="grid grid-cols-2 gap-6">
                {/* Servicios */}
                <div className="space-y-3">
                  <Label>Servicios</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="flete"
                        checked={servicio?.requiere_flete}
                        onCheckedChange={(checked) =>
                          setServicio(prev => ({ ...prev!, requiere_flete: !!checked }))
                        }
                      />
                      <Label htmlFor="flete" className="w-12">Flete</Label>
                      <Input
                        type="number"
                        className="w-24"
                        placeholder="Costo"
                        value={servicio?.coste_flete || ''}
                        onChange={(e) =>
                          setServicio(prev => ({ ...prev!, coste_flete: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="descarga"
                        checked={servicio?.requiere_descarga}
                        onCheckedChange={(checked) =>
                          setServicio(prev => ({ ...prev!, requiere_descarga: !!checked }))
                        }
                      />
                      <Label htmlFor="descarga" className="w-16">Descarga</Label>
                      <Input
                        type="number"
                        className="w-24"
                        placeholder="Costo"
                        value={servicio?.coste_descarga || ''}
                        onChange={(e) =>
                          setServicio(prev => ({ ...prev!, coste_descarga: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Dirección de entrega"
                    value={servicio?.direccion_entrega || ''}
                    onChange={(e) =>
                      setServicio(prev => ({ ...prev!, direccion_entrega: e.target.value }))
                    }
                  />
                </div>

                {/* Pagos */}
                <div>
                  <Label>Forma de Pago</Label>
                  <div className="flex gap-4 mt-2">
                    <Select value={formaPago} onValueChange={(value: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE') => setFormaPago(value)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                        <SelectItem value="YAPE">Yape</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="PENDIENTE">
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="PAGADO">Pagado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Productos */}
              <div className="space-y-4">
                <Input 
                  placeholder="Buscar producto por nombre..." 
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                />
                <Tabs value={categoriaSeleccionada} className="w-full">
                  <TabsList className="w-full justify-start">
                    {categorias.map((cat) => (
                      <TabsTrigger key={cat.id_categoria} value={cat.id_categoria.toString()}>
                        {cat.nombre}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {categorias.map((cat) => (
                    <TabsContent key={cat.id_categoria} value={cat.id_categoria.toString()} className="mt-4">
                      <div className="grid grid-cols-4 gap-2">
                        {productos
                          .filter((p) => p.categoria.id_categoria === cat.id_categoria)
                          .map((p) => (
                            <Button
                              key={p.id_producto}
                              variant="outline"
                              className="h-20 flex flex-col"
                              onClick={() => setModalProducto(p)}
                            >
                              <span className="font-bold">{p.nombre}</span>
                              <span>S/ {Number(p.precio_unitario).toFixed(2)}</span>
                            </Button>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho: Ticket (1 columna) */}
        <Card className="h-full">
          <CardContent className="p-4 space-y-4">
            {/* Cabecera del Ticket */}
            <div className="text-center space-y-1">
              <h2 className="font-bold">{empresaInfo.nombre}</h2>
              <p className="text-sm">RUC: {empresaInfo.ruc}</p>
              <p className="text-sm">{empresaInfo.direccion}</p>
            </div>
            
            {/* Tipo de Comprobante */}
            <div className="text-center border-t border-b py-2">
              <h3 className="font-bold text-lg">{comprobante.tipo}</h3>
              <p className="text-sm">
                {comprobante.serie}-{comprobante.numero}
              </p>
            </div>

            {/* Información de la Venta */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{format(fecha, "dd/MM/yyyy")}</span> {/* Cambiado para usar la fecha seleccionada */}
              </div>
              {clienteSeleccionado && (
                <>
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>{clienteSeleccionado.nombres_apellidos || clienteSeleccionado.razon_social}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{clienteSeleccionado.dni ? 'DNI:' : 'RUC:'}</span>
                    <span>{clienteSeleccionado.dni || clienteSeleccionado.ruc}</span>
                  </div>
                </>
              )}
            </div>

            {/* Servicios Seleccionados */}
            {servicio && (servicio.requiere_flete || servicio.requiere_descarga) && (
              <div className="space-y-1 text-sm border-t pt-2">
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
              </div>
            )}

            {/* Tabla de Productos */}
            <div className="border-t pt-2">
              <table className="w-full text-sm">
                <thead className="text-xs">
                  <tr>
                    <th className="text-left">Producto</th>
                    <th className="text-right">Cant.</th>
                    <th className="text-right">P.Unit</th>
                    <th className="text-right">Importe</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {productosSeleccionados.map((p) => (
                    <tr key={p.id_producto} className="border-b">
                      <td className="py-1">{p.nombre}</td>
                      <td className="text-right">{p.cantidad}</td>
                      <td className="text-right">{Number(p.precio_unitario).toFixed(2)}</td>
                      <td className="text-right">{p.precioTotal.toFixed(2)}</td>
                      <td className="pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
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
                            className="h-4 w-4"
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

            {/* Totales */}
            <div className="space-y-1 text-sm border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Servicios:</span>
                <span>S/ {(servicio ? servicio.coste_flete + servicio.coste_descarga : 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total:</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleConfirmarVenta}>
              Confirmar Venta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modales existentes actualizados con componentes shadcn/ui */}
      {/* Modal Cantidad */}
      {modalProducto && (
        <Dialog open={modalProducto !== null} onOpenChange={() => setModalProducto(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ingresar cantidad - {modalProducto.nombre}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={unidad} onValueChange={(value) => setUnidad(value as "unidad" | "millar")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="millar">Millar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={agregarProducto}>
              Añadir
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Selección de Cliente */}
      <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Gestión de Cliente</DialogTitle>
          </DialogHeader>
          <Tabs value={modalClienteTab} onValueChange={(v) => setModalClienteTab(v as 'buscar' | 'nuevo')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buscar">Buscar Cliente</TabsTrigger>
              <TabsTrigger value="nuevo">Nuevo Cliente</TabsTrigger>
            </TabsList>
            <TabsContent value="buscar" className="space-y-2">
              <Input 
                placeholder="Buscar por DNI/RUC..." 
                value={searchDni}
                className="text-sm"
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
              <ScrollArea className="h-[300px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-medium">
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
                        <td className="p-1">{cliente.nombres_apellidos || cliente.razon_social}</td>
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
            <TabsContent value="nuevo" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Tipo Cliente</Label>
                  <Select 
                    value={nuevoCliente.tipo_cliente}
                    onValueChange={(v) => setNuevoCliente({...nuevoCliente, tipo_cliente: v})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATURAL">Natural</SelectItem>
                      <SelectItem value="JURIDICO">Jurídico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{nuevoCliente.tipo_cliente === 'NATURAL' ? 'DNI' : 'RUC'}</Label>
                  <div className="flex gap-2">
                    <Input
                      className="text-sm"
                      value={nuevoCliente.tipo_cliente === 'NATURAL' ? nuevoCliente.dni : nuevoCliente.ruc}
                      onChange={(e) => setNuevoCliente({
                        ...nuevoCliente,
                        [nuevoCliente.tipo_cliente === 'NATURAL' ? 'dni' : 'ruc']: e.target.value
                      })}
                    />
                    <Button 
                      size="sm"
                      onClick={() => validarDocumento(
                        nuevoCliente.tipo_cliente === 'NATURAL' ? nuevoCliente.dni : nuevoCliente.ruc
                      )}
                    >
                      Validar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm">{nuevoCliente.tipo_cliente === 'NATURAL' ? 'Nombres y Apellidos' : 'Razón Social'}</Label>
                  <Input
                    className="text-sm"
                    value={nuevoCliente.tipo_cliente === 'NATURAL' ? nuevoCliente.nombres_apellidos : nuevoCliente.razon_social}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Celular</Label>
                  <Input
                    className="text-sm"
                    value={nuevoCliente.celular}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, celular: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Dirección</Label>
                  <Input
                    className="text-sm"
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                  />
                </div>
              </div>
              <Button className="w-full text-sm" onClick={registrarNuevoCliente}>
                Registrar Cliente
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Servicios */}
      <Dialog open={modalServicios} onOpenChange={setModalServicios}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Servicios</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flete"
                checked={servicio?.requiere_flete}
                onCheckedChange={(checked) =>
                  setServicio(prev => ({ ...prev!, requiere_flete: !!checked }))
                }
              />
              <Label htmlFor="flete">Requiere Flete</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="descarga"
                checked={servicio?.requiere_descarga}
                onCheckedChange={(checked) =>
                  setServicio(prev => ({ ...prev!, requiere_descarga: !!checked }))
                }
              />
              <Label htmlFor="descarga">Requiere Descarga</Label>
            </div>
            <div className="space-y-2">
              <Label>Dirección de Entrega</Label>
              <Input
                value={servicio?.direccion_entrega || ''}
                onChange={(e) =>
                  setServicio(prev => ({ ...prev!, direccion_entrega: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coste Flete</Label>
                <Input
                  type="number"
                  value={servicio?.coste_flete || ''}
                  onChange={(e) =>
                    setServicio(prev => ({ ...prev!, coste_flete: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Coste Descarga</Label>
                <Input
                  type="number"
                  value={servicio?.coste_descarga || ''}
                  onChange={(e) =>
                    setServicio(prev => ({ ...prev!, coste_descarga: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalServicios(false)}>
              Cancelar
            </Button>
            <Button onClick={agregarServicio}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
