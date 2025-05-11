"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
    AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Categoria {
    id_categoria: number;
    nombre: string;
    descripcion?: string;
    id_empresa: number;
}

interface Producto {
    id_producto: number;
    nombre: string;
    descripcion?: string;
    precio_unitario: number;
    peso: number;
    dimensiones: string;
    estado: boolean;
    categoria_id_categoria: number;
    id_empresa: number;
    categoria: Categoria;
}

export default function ProductosPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);

    // Estados para modales y datos
    const [showProductoModal, setShowProductoModal] = useState(false);
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [currentProducto, setCurrentProducto] = useState<Partial<Producto>>({});
    const [currentCategoria, setCurrentCategoria] = useState<Partial<Categoria>>({});
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteType, setDeleteType] = useState<'producto' | 'categoria'>('producto');

    useEffect(() => {
        document.title = "Gestión de productos";
        fetchProductos();
        fetchCategorias();
    }, []);

    const fetchProductos = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/productos");
            const data = await res.json();
            setProductos(data);
        } catch (error) {
            toast.error("Error al cargar productos");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategorias = async () => {
        try {
            const res = await fetch("/api/productos?type=categorias");
            const data = await res.json();
            setCategorias(data);
        } catch (error) {
            toast.error("Error al cargar categorías");
        }
    };

    const handleSaveCategoria = async () => {
        try {
            if (!currentCategoria.nombre?.trim()) {
                toast.error("El nombre de la categoría es obligatorio");
                return;
            }

            const method = currentCategoria.id_categoria ? "PUT" : "POST";
            const res = await fetch(`/api/productos?type=categoria`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentCategoria),
            });

            if (!res.ok) throw new Error("Error al guardar categoría");

            toast.success(currentCategoria.id_categoria ?
                "Categoría actualizada" : "Categoría creada");
            setCurrentCategoria({}); // Solo limpiamos el formulario
            fetchCategorias(); // Actualizamos la tabla
        } catch (error) {
            toast.error("Error al guardar categoría");
        }
    };

    const handleSaveProducto = async () => {
        try {
            // Validaciones
            if (!currentProducto.categoria_id_categoria) {
                toast.error("Debe seleccionar una categoría");
                return;
            }
            if (!currentProducto.nombre?.trim()) {
                toast.error("El nombre del producto es obligatorio");
                return;
            }
            if (!currentProducto.precio_unitario || currentProducto.precio_unitario <= 0) {
                toast.error("El precio unitario debe ser mayor a 0");
                return;
            }
            if (!currentProducto.peso || currentProducto.peso <= 0) {
                toast.error("El peso debe ser mayor a 0");
                return;
            }
            if (!currentProducto.dimensiones?.trim()) {
                toast.error("Las dimensiones son obligatorias");
                return;
            }
            if (currentProducto.estado === undefined) {
                toast.error("Debe seleccionar un estado");
                return;
            }

            const productoData = {
                ...(currentProducto.id_producto && { id_producto: currentProducto.id_producto }), // Añadir id_producto si existe
                categoria_id_categoria: Number(currentProducto.categoria_id_categoria),
                nombre: currentProducto.nombre?.trim(),
                precio_unitario: Number(currentProducto.precio_unitario),
                peso: Number(currentProducto.peso),
                dimensiones: currentProducto.dimensiones?.trim(),
                estado: Number(currentProducto.estado), // Convertir boolean a número
                descripcion: currentProducto.descripcion
            };

            console.log('Datos a enviar:', productoData); // Para debug

            const method = currentProducto.id_producto ? "PUT" : "POST";
            const res = await fetch("/api/productos", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productoData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Error al guardar producto");
            }

            toast.success(currentProducto.id_producto ?
                "Producto actualizado" : "Producto creado");
            setShowProductoModal(false);
            setCurrentProducto({});
            fetchProductos();
        } catch (error) {
            console.error('Error:', error);
            toast.error("Error al " + (currentProducto.id_producto ? "actualizar" : "crear") + " producto");
        }
    };

    const handleEdit = (producto: Producto) => {
        // Asegurarnos de convertir correctamente los tipos de datos
        setCurrentProducto({
            id_producto: producto.id_producto,
            categoria_id_categoria: producto.categoria.id_categoria,
            nombre: producto.nombre,
            descripcion: producto.descripcion || undefined,
            precio_unitario: Number(producto.precio_unitario),
            peso: Number(producto.peso),
            dimensiones: producto.dimensiones,
            estado: Boolean(producto.estado) // Convertir número a boolean para el select
        });
        setShowProductoModal(true);
    };

    const handleDelete = async () => {
        try {
            const type = deleteType === 'categoria' ? 'categoria' : '';
            const res = await fetch(`/api/productos?type=${type}&id=${deleteId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Error al eliminar");

            toast.success(`${deleteType === 'categoria' ? 'Categoría' : 'Producto'} eliminado`);
            setShowDeleteDialog(false);
            setDeleteId(null);

            // Si es categoría, solo actualizamos la tabla de categorías y mantenemos el modal abierto
            if (deleteType === 'categoria') {
                fetchCategorias();
            } else {
                fetchProductos();
                setShowProductoModal(false);
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Gestión de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-muted-foreground">
                        En este módulo puede gestionar las categorias y los productos.
                    </p>
                    <div className="flex gap-4 mb-6">
                        <Button onClick={() => setShowCategoriaModal(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Categoría
                        </Button>
                        <Button onClick={() => setShowProductoModal(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Producto
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Cargando datos...</span>
                        </div>
                    ) : productos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay productos registrados.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Peso</TableHead>
                                        <TableHead>Dimensiones</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productos.map((producto) => (
                                        <TableRow key={producto.id_producto}>
                                            <TableCell>{producto.nombre}</TableCell>
                                            <TableCell>{producto.categoria?.nombre}</TableCell>
                                            <TableCell>S/. {producto.precio_unitario}</TableCell>
                                            <TableCell>{producto.peso} Kg</TableCell>
                                            <TableCell>{producto.dimensiones}</TableCell>
                                            <TableCell>
                                                <Badge variant={producto.estado ? "success" : "destructive"}>
                                                    {producto.estado ? "Disponible" : "No disponible"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleEdit(producto)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setDeleteType('producto');
                                                            setDeleteId(producto.id_producto);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Categoría */}
            <Dialog open={showCategoriaModal} onOpenChange={setShowCategoriaModal}>
                <DialogContent className="sm:max-w-[1000px]"> {/* Aumentado el ancho máximo */}
                    <DialogHeader>
                        <DialogTitle>Gestión de Categorías</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Aumentado el gap */}
                        {/* Formulario de Categoría */}
                        <div className="space-y-4 bg-muted p-4 rounded-lg"> {/* Añadido fondo y padding */}
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input
                                    id="nombre"
                                    value={currentCategoria.nombre || ""}
                                    onChange={(e) =>
                                        setCurrentCategoria({ ...currentCategoria, nombre: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                                <Input
                                    id="descripcion"
                                    value={currentCategoria.descripcion || ""}
                                    onChange={(e) =>
                                        setCurrentCategoria({ ...currentCategoria, descripcion: e.target.value })
                                    }
                                />
                            </div>
                            <Button onClick={handleSaveCategoria} className="w-full">
                                {currentCategoria.id_categoria ? "Actualizar" : "Guardar"}
                            </Button>
                        </div>

                        {/* Tabla de Categorías */}
                        <div className="md:col-span-2 overflow-y-auto max-h-[500px]"> {/* Añadida altura máxima y scroll */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categorias.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center">
                                                    No hay categorías registradas
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            categorias.map((categoria) => (
                                                <TableRow key={categoria.id_categoria}>
                                                    <TableCell>{categoria.nombre}</TableCell>
                                                    <TableCell>{categoria.descripcion || "-"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => setCurrentCategoria(categoria)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    setDeleteType('categoria');
                                                                    setDeleteId(categoria.id_categoria);
                                                                    setShowDeleteDialog(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Producto */}
            <Dialog open={showProductoModal} onOpenChange={setShowProductoModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {currentProducto.id_producto ? "Editar" : "Nuevo"} Producto
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoria">Categoría</Label>
                                <Select
                                    value={currentProducto.categoria_id_categoria?.toString()}
                                    onValueChange={(value) =>
                                        setCurrentProducto({
                                            ...currentProducto,
                                            categoria_id_categoria: Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((cat) => (
                                            <SelectItem
                                                key={cat.id_categoria}
                                                value={cat.id_categoria.toString()}
                                            >
                                                {cat.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input
                                    id="nombre"
                                    value={currentProducto.nombre || ""}
                                    onChange={(e) =>
                                        setCurrentProducto({ ...currentProducto, nombre: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="precio">Precio Unitario (S/.)</Label>
                                <Input
                                    id="precio"
                                    type="number"
                                    step="0.01"
                                    value={currentProducto.precio_unitario || ""}
                                    onChange={(e) =>
                                        setCurrentProducto({
                                            ...currentProducto,
                                            precio_unitario: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="peso">Peso (Kg)</Label>
                                <Input
                                    id="peso"
                                    type="number"
                                    step="0.01"
                                    value={currentProducto.peso || ""}
                                    onChange={(e) =>
                                        setCurrentProducto({
                                            ...currentProducto,
                                            peso: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dimensiones">Dimensiones</Label>
                                <Input
                                    id="dimensiones"
                                    value={currentProducto.dimensiones || ""}
                                    onChange={(e) =>
                                        setCurrentProducto({
                                            ...currentProducto,
                                            dimensiones: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado">Estado</Label>
                                <Select
                                    value={String(currentProducto.estado)}
                                    onValueChange={(value) =>
                                        setCurrentProducto({
                                            ...currentProducto,
                                            estado: value === "true"
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Disponible</SelectItem>
                                        <SelectItem value="false">No disponible</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                            <Input
                                id="descripcion"
                                value={currentProducto.descripcion || ""}
                                onChange={(e) =>
                                    setCurrentProducto({
                                        ...currentProducto,
                                        descripcion: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProductoModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveProducto}>
                            {currentProducto.id_producto ? "Actualizar" : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación para eliminar */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro de eliminar este {deleteType}? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
