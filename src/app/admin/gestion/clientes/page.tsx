"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
         AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

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
    const itemsPerPage = 20;

    useEffect(() => {
        document.title = "Gestión de Clientes";
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/clientes");
            const data = await res.json();
            setClientes(data);
        } catch (error) {
            toast.error("Error al cargar clientes");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!currentCliente.tipo_cliente) {
                toast.error("Debe seleccionar un tipo de cliente");
                return;
            }

            // Validar formato de celular si se proporciona
            if (currentCliente.celular && currentCliente.celular.length !== 9) {
                toast.error("El número de celular debe tener 9 dígitos");
                return;
            }

            // Validar formato de email si se proporciona
            if (currentCliente.correo && !isValidEmail(currentCliente.correo)) {
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
            // Validaciones para otros tipos de cliente
            else if (currentCliente.tipo_cliente === 'NATURAL') {
                if (!currentCliente.dni?.trim() || !currentCliente.nombres_apellidos?.trim()) {
                    toast.error("DNI y Nombres son obligatorios para persona natural");
                    return;
                }
            } else if (currentCliente.tipo_cliente === 'JURIDICA') {
                if (!currentCliente.ruc?.trim() || !currentCliente.razon_social?.trim()) {
                    toast.error("RUC y Razón Social son obligatorios para persona jurídica");
                    return;
                }
            }

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
            fetchClientes();
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
            fetchClientes();
        } catch (error) {
            toast.error("Error al eliminar cliente");
        }
    };

    const validateDocument = async (tipo: string, numero: string) => {
        try {
            setValidating(true);
            if (tipo === 'NATURAL') {
                if (!numero || numero.length !== 8) {
                    toast.error("El DNI debe tener 8 dígitos");
                    return;
                }

                const res = await fetch('/api/validar-cliente-dni', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dni: numero }),
                });

                const data = await res.json();
                
                if (!data.success) {
                    toast.error(data.message);
                    return;
                }

                setCurrentCliente(prev => ({
                    ...prev,
                    nombres_apellidos: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
                }));
                toast.success("DNI validado correctamente");
            } else {
                if (!numero || numero.length !== 11) {
                    toast.error("El RUC debe tener 11 dígitos");
                    return;
                }

                const res = await fetch('/api/validar-cliente-ruc', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ruc: numero }),
                });

                const data = await res.json();

                if (!data.success) {
                    toast.error(data.message);
                    return;
                }

                setCurrentCliente(prev => ({
                    ...prev,
                    razon_social: data.razonSocial
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

    // Función para filtrar clientes
    const filteredClientes = clientes.filter((cliente) => {
        const matchSearch = (cliente.dni || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cliente.nombres_apellidos || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cliente.ruc || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cliente.razon_social || '')?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchTipo = filterTipo === "TODOS" || !filterTipo ? true : cliente.tipo_cliente === filterTipo;
        
        return matchSearch && matchTipo;
    });

    // Calcular paginación
    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
    const currentClientes = filteredClientes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
                    ) : clientes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay clientes registrados.
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
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                <span className="py-2 px-4">
                    Página {currentPage} de {totalPages}
                </span>
                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
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
                                        <Label htmlFor="dni">DNI</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="dni"
                                                maxLength={8}
                                                value={currentCliente.dni || ""}
                                                onChange={(e) =>
                                                    setCurrentCliente({ ...currentCliente, dni: e.target.value })
                                                }
                                            />
                                            <Button 
                                                type="button"
                                                variant="secondary"
                                                className="bg-green-500 hover:bg-green-600 text-white"
                                                onClick={() => validateDocument('NATURAL', currentCliente.dni || '')}
                                                disabled={validating}
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
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nombres_apellidos">Nombres y Apellidos</Label>
                                        <Input
                                            id="nombres_apellidos"
                                            value={currentCliente.nombres_apellidos || ""}
                                            onChange={(e) =>
                                                setCurrentCliente({ ...currentCliente, nombres_apellidos: e.target.value })
                                            }
                                            disabled={currentCliente.tipo_cliente === 'NATURAL'}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : currentCliente.tipo_cliente === 'JURIDICA' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ruc">RUC</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="ruc"
                                                maxLength={11}
                                                value={currentCliente.ruc || ""}
                                                onChange={(e) =>
                                                    setCurrentCliente({ ...currentCliente, ruc: e.target.value })
                                                }
                                            />
                                            <Button 
                                                type="button"
                                                variant="secondary"
                                                className="bg-green-500 hover:bg-green-600 text-white"
                                                onClick={() => validateDocument('JURIDICA', currentCliente.ruc || '')}
                                                disabled={validating}
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
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="razon_social">Razón Social</Label>
                                        <Input
                                            id="razon_social"
                                            value={currentCliente.razon_social || ""}
                                            onChange={(e) =>
                                                setCurrentCliente({ ...currentCliente, razon_social: e.target.value })
                                            }
                                            disabled={currentCliente.tipo_cliente === 'JURIDICA'}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : null}

                        {/* Solo mostrar campos adicionales si no es GENERICO */}
                        {currentCliente.tipo_cliente !== 'GENERICO' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input
                                        id="direccion"
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
                                            pattern="[0-9]*"
                                            value={currentCliente.celular || ""}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setCurrentCliente({
                                                    ...currentCliente,
                                                    celular: value
                                                });
                                            }}
                                            onInput={(e) => {
                                                const input = e.target as HTMLInputElement;
                                                if (input.value.length > 9) {
                                                    input.value = input.value.slice(0, 9);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="correo">Correo (Opcional)</Label>
                                        <Input
                                            id="correo"
                                            type="email"
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
