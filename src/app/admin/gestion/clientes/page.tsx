"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { PlusCircle, Pencil, Trash2, Loader2, Search } from "lucide-react";

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

interface Cliente {
    id_cliente: number;
    tipo_cliente: string;
    dni?: string;
    ruc?: string;
    nombres_apellidos?: string;
    razon_social?: string;
    direccion?: string;
    celular?: string;
    correo?: string;
    id_empresa: number;
}

export default function ClientesPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [currentCliente, setCurrentCliente] = useState<Partial<Cliente>>({});
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [validating, setValidating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTipo, setFilterTipo] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        document.title = "Gestión de Clientes";
        fetchClientes(currentPage, itemsPerPage, searchTerm, filterTipo);
    }, [currentPage, searchTerm, filterTipo]);
    
    // Resetear a página 1 cuando cambian los filtros
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [searchTerm, filterTipo]);

    const fetchClientes = async (page = 1, limit = 10, search = '', tipo = '') => {
        try {
            setLoading(true);
            const searchParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });
            
            if (search) searchParams.append('search', search);
            if (tipo && tipo !== 'TODOS') searchParams.append('tipo', tipo);
            
            const res = await fetch(`/api/clientes?${searchParams.toString()}`);
            const data = await res.json();

            // La respuesta tiene una estructura { clientes: [], totalPaginas: number }
            if (data && Array.isArray(data.clientes)) {
                setClientes(data.clientes);
                setTotalPages(data.totalPaginas || 1);
                setCurrentPage(data.paginaActual || 1);
            } else {
                setClientes([]);
                console.error('Estructura de respuesta inválida:', data);
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            toast.error("Error al cargar clientes");
            setClientes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // 1. Validación obligatoria: tipo de cliente
            if (!currentCliente.tipo_cliente) {
                toast.error("Debe seleccionar un tipo de cliente");
                return;
            }

            // 2. Validaciones según tipo de cliente
            if (currentCliente.tipo_cliente === 'NATURAL') {
                // Nombres/apellidos es obligatorio para persona natural
                if (!currentCliente.nombres_apellidos?.trim()) {
                    toast.error("Los nombres y apellidos son obligatorios para persona natural");
                    return;
                }
                
                // 3. Validar DNI solo si tiene contenido (no es obligatorio pero si tiene valor debe ser válido)
                if (currentCliente.dni && currentCliente.dni.trim() !== '') {
                    if (currentCliente.dni.length !== 8) {
                        toast.error("El DNI debe tener exactamente 8 dígitos");
                        return;
                    }
                    if (!/^\d{8}$/.test(currentCliente.dni)) {
                        toast.error("El DNI solo debe contener números");
                        return;
                    }
                }
            } else if (currentCliente.tipo_cliente === 'JURIDICA') {
                // Razón social es obligatoria para persona jurídica
                if (!currentCliente.razon_social?.trim()) {
                    toast.error("La razón social es obligatoria para persona jurídica");
                    return;
                }
                
                // 4. Validar RUC solo si tiene contenido (no es obligatorio pero si tiene valor debe ser válido)
                if (currentCliente.ruc && currentCliente.ruc.trim() !== '') {
                    if (currentCliente.ruc.length !== 11) {
                        toast.error("El RUC debe tener exactamente 11 dígitos");
                        return;
                    }
                    if (!/^\d{11}$/.test(currentCliente.ruc)) {
                        toast.error("El RUC solo debe contener números");
                        return;
                    }
                }
            }

            // 6. Validar celular solo si se proporciona (opcional)
            if (currentCliente.celular && currentCliente.celular.trim() !== '') {
                if (currentCliente.celular.length !== 9) {
                    toast.error("El número de celular debe tener exactamente 9 dígitos");
                    return;
                }
                if (!/^\d{9}$/.test(currentCliente.celular)) {
                    toast.error("El celular solo debe contener números");
                    return;
                }
            }

            // 6. Validar formato de email solo si se proporciona (opcional)
            if (currentCliente.correo && currentCliente.correo.trim() !== '' && !isValidEmail(currentCliente.correo)) {
                toast.error("El formato del correo electrónico no es válido");
                return;
            }

            let clienteToSave = { ...currentCliente };

            // Para cliente genérico, establecer datos por defecto
            if (currentCliente.tipo_cliente === 'GENERICO') {
                clienteToSave = {
                    ...clienteToSave,
                    nombres_apellidos: "CLIENTE GENERICO",
                    dni: undefined,
                    ruc: undefined,
                    razon_social: undefined,
                    direccion: undefined,
                    celular: undefined,
                    correo: undefined
                };
            }

            // Limpiar campos vacíos para enviar null en lugar de strings vacíos
            if (clienteToSave.dni === '') clienteToSave.dni = undefined;
            if (clienteToSave.ruc === '') clienteToSave.ruc = undefined;
            if (clienteToSave.direccion === '') clienteToSave.direccion = undefined;
            if (clienteToSave.celular === '') clienteToSave.celular = undefined;
            if (clienteToSave.correo === '') clienteToSave.correo = undefined;

            const method = currentCliente.id_cliente ? "PUT" : "POST";
            const res = await fetch("/api/clientes", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(clienteToSave),
            });

            if (!res.ok) throw new Error("Error al guardar");

            toast.success(currentCliente.id_cliente ? "Cliente actualizado" : "Cliente creado");
            setShowModal(false);
            setCurrentCliente({});
            fetchClientes(currentPage, itemsPerPage, searchTerm, filterTipo);
        } catch (error) {
            toast.error("Error al guardar cliente");
        }
    };

    // Función para validar formato de email
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/clientes?id=${deleteId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");

            toast.success("Cliente eliminado");
            setShowDeleteDialog(false);
            fetchClientes(currentPage, itemsPerPage, searchTerm, filterTipo);
        } catch (error) {
            toast.error("Error al eliminar cliente");
        }
    };

    const validateDocument = async (tipo: string, numero: string) => {
        try {
            setValidating(true);
            
            if (tipo === 'NATURAL') {
                if (!numero || numero.length !== 8) {
                    toast.error("El DNI debe tener exactamente 8 dígitos para poder validar");
                    return;
                }

                if (!/^\d{8}$/.test(numero)) {
                    toast.error("El DNI solo debe contener números");
                    return;
                }

                const res = await fetch('/api/validar-identidad', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tipo: "cliente",
                        numero: numero
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    toast.error(errorData.message || "Error al validar DNI");
                    return;
                }

                const data = await res.json();

                // Actualizar para usar los nombres de campo correctos según tu API
                setCurrentCliente(prev => ({
                    ...prev,
                    nombres_apellidos: data.nombre_completo ||
                        `${data.apellido_paterno} ${data.apellido_materno} ${data.nombres}`.trim()
                }));
                toast.success("DNI validado correctamente");
                
            } else if (tipo === 'JURIDICA') {
                if (!numero || numero.length !== 11) {
                    toast.error("El RUC debe tener exactamente 11 dígitos para poder validar");
                    return;
                }

                if (!/^\d{11}$/.test(numero)) {
                    toast.error("El RUC solo debe contener números");
                    return;
                }

                const res = await fetch('/api/validar-identidad', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tipo: "cliente",
                        numero: numero
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    toast.error(errorData.message || "Error al validar RUC");
                    return;
                }

                const data = await res.json();

                // Actualizar para usar los nombres de campo correctos según tu API
                setCurrentCliente(prev => ({
                    ...prev,
                    razon_social: data.razon_social,
                    direccion: data.direccion !== '-' ? data.direccion : prev.direccion
                }));
                toast.success("RUC validado correctamente");
            }
        } catch (error) {
            console.error('Error en validación:', error);
            toast.error(`Error al validar ${tipo === 'NATURAL' ? 'DNI' : 'RUC'}`);
        } finally {
            setValidating(false);
        }
    };

    // TODO: Implementar filtros del lado del servidor
    // Por ahora usamos directamente los clientes del servidor
    const currentClientes = clientes;

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Clientes</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Administre los clientes de la empresa. Puede registrar tanto personas naturales como jurídicas.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <Button onClick={() => {
                            setCurrentCliente({});
                            setShowModal(true);
                        }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Cliente
                        </Button>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por DNI o nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <Select
                            value={filterTipo}
                            onValueChange={setFilterTipo}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos</SelectItem>
                                <SelectItem value="GENERICO">Genérico</SelectItem>
                                <SelectItem value="NATURAL">Natural</SelectItem>
                                <SelectItem value="JURIDICA">Jurídica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Cargando datos...</span>
                        </div>
                    ) : currentClientes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay clientes registrados en esta página.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>DNI/RUC</TableHead>
                                        <TableHead>Nombre/Razón Social</TableHead>
                                        <TableHead>Dirección</TableHead>
                                        <TableHead>Celular</TableHead>
                                        <TableHead>Correo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentClientes.map((cliente) => (
                                        <TableRow key={cliente.id_cliente}>
                                            <TableCell>{cliente.tipo_cliente}</TableCell>
                                            <TableCell>{cliente.dni || cliente.ruc}</TableCell>
                                            <TableCell>{cliente.nombres_apellidos || cliente.razon_social}</TableCell>
                                            <TableCell>{cliente.direccion || "-"}</TableCell>
                                            <TableCell>{cliente.celular || "-"}</TableCell>
                                            <TableCell>{cliente.correo || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setCurrentCliente(cliente);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setDeleteId(cliente.id_cliente);
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

            {/* Paginación */}
            <div className="flex justify-center gap-2 mt-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (currentPage > 1) {
                            const newPage = currentPage - 1;
                            setCurrentPage(newPage);
                            fetchClientes(newPage, itemsPerPage, searchTerm, filterTipo);
                        }
                    }}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                <span className="py-2 px-4">
                    Página {currentPage} de {totalPages}
                </span>
                <Button
                    variant="outline"
                    onClick={() => {
                        if (currentPage < totalPages) {
                            const newPage = currentPage + 1;
                            setCurrentPage(newPage);
                            fetchClientes(newPage, itemsPerPage, searchTerm, filterTipo);
                        }
                    }}
                    disabled={currentPage >= totalPages}
                >
                    Siguiente
                </Button>
            </div>

            {/* Modal de Cliente */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {currentCliente.id_cliente ? "Editar" : "Nuevo"} Cliente
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Los campos marcados con (*) son obligatorios. 
                            DNI/RUC son opcionales, pero si se ingresan deben tener el formato correcto.
                        </p>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo_cliente">Tipo de Cliente *</Label>
                            <Select
                                value={currentCliente.tipo_cliente}
                                onValueChange={(value) => {
                                    setCurrentCliente({
                                        tipo_cliente: value,
                                        // Limpiar campos al cambiar tipo
                                        dni: undefined,
                                        ruc: undefined,
                                        nombres_apellidos: undefined,
                                        razon_social: undefined
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GENERICO">Cliente Genérico</SelectItem>
                                    <SelectItem value="NATURAL">Persona Natural</SelectItem>
                                    <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {currentCliente.tipo_cliente === 'NATURAL' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dni">DNI (Opcional)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="dni"
                                                maxLength={8}
                                                placeholder="12345678"
                                                value={currentCliente.dni || ""}
                                                onChange={(e) => {
                                                    // Solo permitir números y máximo 8 dígitos
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                    setCurrentCliente({ ...currentCliente, dni: value });
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="bg-green-500 hover:bg-green-600 text-white"
                                                onClick={() => validateDocument('NATURAL', currentCliente.dni || '')}
                                                disabled={validating || !currentCliente.dni || currentCliente.dni.length !== 8}
                                            >
                                                {validating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Validando...
                                                    </>
                                                ) : (
                                                    "Validar"
                                                )}
                                            </Button>
                                        </div>
                                        {currentCliente.dni && currentCliente.dni.length > 0 && currentCliente.dni.length < 8 && (
                                            <p className="text-sm text-red-500">El DNI debe tener 8 dígitos completos</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nombres_apellidos">Nombres y Apellidos *</Label>
                                        <Input
                                            id="nombres_apellidos"
                                            placeholder="Ingrese nombres y apellidos"
                                            value={currentCliente.nombres_apellidos || ""}
                                            onChange={(e) =>
                                                setCurrentCliente({ ...currentCliente, nombres_apellidos: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        ) : currentCliente.tipo_cliente === 'JURIDICA' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ruc">RUC (Opcional)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="ruc"
                                                maxLength={11}
                                                placeholder="12345678901"
                                                value={currentCliente.ruc || ""}
                                                onChange={(e) => {
                                                    // Solo permitir números y máximo 11 dígitos
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                    setCurrentCliente({ ...currentCliente, ruc: value });
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="bg-green-500 hover:bg-green-600 text-white"
                                                onClick={() => validateDocument('JURIDICA', currentCliente.ruc || '')}
                                                disabled={validating || !currentCliente.ruc || currentCliente.ruc.length !== 11}
                                            >
                                                {validating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Validando...
                                                    </>
                                                ) : (
                                                    "Validar"
                                                )}
                                            </Button>
                                        </div>
                                        {currentCliente.ruc && currentCliente.ruc.length > 0 && currentCliente.ruc.length < 11 && (
                                            <p className="text-sm text-red-500">El RUC debe tener 11 dígitos completos</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="razon_social">Razón Social *</Label>
                                        <Input
                                            id="razon_social"
                                            placeholder="Ingrese razón social"
                                            value={currentCliente.razon_social || ""}
                                            onChange={(e) =>
                                                setCurrentCliente({ ...currentCliente, razon_social: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        ) : null}

                        {/* Solo mostrar campos adicionales si no es GENERICO */}
                        {currentCliente.tipo_cliente !== 'GENERICO' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="direccion">Dirección (Opcional)</Label>
                                    <Input
                                        id="direccion"
                                        placeholder="Ingrese dirección"
                                        value={currentCliente.direccion || ""}
                                        onChange={(e) =>
                                            setCurrentCliente({ ...currentCliente, direccion: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="celular">Celular (Opcional)</Label>
                                        <Input
                                            id="celular"
                                            maxLength={9}
                                            placeholder="987654321"
                                            value={currentCliente.celular || ""}
                                            onChange={(e) => {
                                                // Solo permitir números y máximo 9 dígitos
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                                setCurrentCliente({
                                                    ...currentCliente,
                                                    celular: value
                                                });
                                            }}
                                        />
                                        {currentCliente.celular && currentCliente.celular.length > 0 && currentCliente.celular.length < 9 && (
                                            <p className="text-sm text-red-500">El celular debe tener 9 dígitos completos</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="correo">Correo (Opcional)</Label>
                                        <Input
                                            id="correo"
                                            type="email"
                                            placeholder="correo@ejemplo.com"
                                            value={currentCliente.correo || ""}
                                            onChange={(e) =>
                                                setCurrentCliente({
                                                    ...currentCliente,
                                                    correo: e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>
                            {currentCliente.id_cliente ? "Actualizar" : "Guardar"}
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
                            ¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.
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
