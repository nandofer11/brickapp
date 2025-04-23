"use client";
import { useState } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";

// Interfaces
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
}

interface ProductoSeleccionado extends Producto {
  cantidad: number;
  unidad: "unidad" | "millar";
  precioTotal: number;
}

interface Servicio {
  direccion: string;
  incluyeFlete: boolean;
  monto: number;
}

export default function VentaPage() {
  const categorias: string[] = ["Muro", "Techo", "Otros"];
  const productos: Producto[] = [
    { id: 1, nombre: "Ladrillo Muro", precio: 1.2, categoria: "Muro" },
    { id: 2, nombre: "Ladrillo Techo", precio: 1.5, categoria: "Techo" },
    { id: 3, nombre: "Ladrillo Común", precio: 1.0, categoria: "Otros" },
  ];

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
  const [servicio, setServicio] = useState<Servicio | null>(null);

  // Agregar producto al detalle de venta
  const agregarProducto = () => {
    if (!modalProducto) return;
    const precioTotal =
      unidad === "unidad" ? cantidad * modalProducto.precio : cantidad * 1000 * modalProducto.precio;
    setProductosSeleccionados([...productosSeleccionados, { ...modalProducto, cantidad, unidad, precioTotal }]);
    setModalProducto(null);
    setCantidad(1);
    setUnidad("unidad");
  };

  // Eliminar producto del detalle
  const eliminarProducto = (id: number) => {
    setProductosSeleccionados(productosSeleccionados.filter((p) => p.id !== id));
  };

  // Guardar servicio
  const agregarServicio = () => {
    setServicio({ direccion, incluyeFlete, monto: montoServicio });
    setModalServicios(false);
    setDireccion("");
    setMontoServicio(0);
  };

  // Calcular totales
  const subtotal = productosSeleccionados.reduce((sum, p) => sum + p.precioTotal, 0);
  const total = servicio ? subtotal + servicio.monto : subtotal;

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Sección de Productos */}
        <div className="col-md-7">
          <div className="card" style={{ height: "500px", overflowY: "auto" }}>
            <div className="card-header">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  className={`btn ${categoriaSeleccionada === cat ? "btn-primary" : "btn-outline-primary"} me-2`}
                  onClick={() => setCategoriaSeleccionada(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="card-body d-flex flex-wrap gap-2">
              {productos
                .filter((p) => p.categoria === categoriaSeleccionada)
                .map((p) => (
                  <button key={p.id} className="btn btn-outline-dark m-1" onClick={() => setModalProducto(p)}>
                    {p.nombre} - S/{p.precio.toFixed(2)}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Sección Cliente y Detalle de Venta */}
        <div className="col-md-5">
          <div className="card" style={{ height: "500px", overflowY: "auto" }}>
            <div className="card-header d-flex align-items-center">
              <input
                type="checkbox"
                className="me-2"
                checked={clienteVarios}
                onChange={() => setClienteVarios(!clienteVarios)}
              />
              Cliente Varios
              <button className="btn btn-outline-primary btn-sm w-100 ms-2" onClick={() => setModalCliente(true)}>
                Agregar Cliente
              </button>
            </div>
            <div className="card-body">
              {productosSeleccionados.length === 0 ? (
                <p>No hay productos en la venta.</p>
              ) : (
                <ul className="list-group">
                  {productosSeleccionados.map((p) => (
                    <li key={p.id} className="list-group-item d-flex justify-content-between">
                      <span>
                        {p.nombre} ({p.cantidad} {p.unidad}) - S/{p.precioTotal.toFixed(2)}
                      </span>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminarProducto(p.id)}>❌</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card-footer">
              <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => setModalServicios(true)}>
                Agregar Servicios
              </button>
              <div className="border p-2">
                <p>Subtotal: S/{subtotal.toFixed(2)}</p>
                <p>Servicios Extras: S/{servicio?.monto.toFixed(2) || "0.00"}</p>
                <h5>Total: S/{total.toFixed(2)}</h5>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <button className="btn btn-danger">Cancelar Venta</button>
                <button className="btn btn-success">Confirmar Venta</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cantidad */}
      {modalProducto && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar {modalProducto.nombre}</h5>
                <button className="btn-close" onClick={() => setModalProducto(null)}></button>
              </div>
              <div className="modal-body">
                <input type="number" className="form-control mb-2" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
                <select className="form-control" value={unidad} onChange={(e) => setUnidad(e.target.value as "unidad" | "millar")}>
                  <option value="unidad">Unidad</option>
                  <option value="millar">Millar</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={agregarProducto}>Añadir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Servicio */}
      {modalServicios && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar Servicio</h5>
                <button className="btn-close" onClick={() => setModalServicios(false)}></button>
              </div>
              <div className="modal-body">
                <input type="text" className="form-control mb-2" placeholder="Dirección" onChange={(e) => setDireccion(e.target.value)} />
                <input type="number" className="form-control" placeholder="Monto total" onChange={(e) => setMontoServicio(Number(e.target.value))} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={agregarServicio}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
