"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Plus, Search, Building2, Phone, Mail, MapPin, Users, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Interfaces
interface Proveedor {
  id_proveedor: number;
  tipo_documento: string;
  nro_documento?: string;
  nombre: string;
  ciudad?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface ProveedorFormData {
  tipo_documento?: string;
  nro_documento: string;
  nombre: string;
  ciudad: string;
  telefono: string;
  celular: string;
  email: string;
}

interface Stats {
  total: number;
  porTipo: Array<{ tipo: string; cantidad: number }>;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentProveedor, setCurrentProveedor] = useState<Partial<ProveedorFormData>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProveedores();
    fetchStats();
  }, [currentPage, searchTerm, filterTipo]);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterTipo && filterTipo !== "all") params.append('tipo_documento', filterTipo);

      const response = await fetch(`/api/proveedor?${params}`);
      if (!response.ok) throw new Error('Error al cargar proveedores');

      const data = await response.json();
      setProveedores(data.proveedores);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/proveedor?stats=true');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validaciones básicas
      if (!currentProveedor.nombre) {
        toast.error('El nombre es obligatorio');
        return;
      }

      const url = editingId ? `/api/proveedor?id=${editingId}` : '/api/proveedor';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProveedor),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar proveedor');
      }

      toast.success(editingId ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente');
      setShowModal(false);
      setCurrentProveedor({});
      setEditingId(null);
      fetchProveedores();
      fetchStats();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setCurrentProveedor({
      tipo_documento: proveedor.tipo_documento,
      nro_documento: proveedor.nro_documento || '',
      nombre: proveedor.nombre,
      ciudad: proveedor.ciudad || '',
      telefono: proveedor.telefono || '',
      celular: proveedor.celular || '',
      email: proveedor.email || '',
    });
    setEditingId(proveedor.id_proveedor);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/proveedor?id=${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar proveedor');
      }

      toast.success('Proveedor eliminado exitosamente');
      setShowDeleteDialog(false);
      setDeleteId(null);
      fetchProveedores();
      fetchStats();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar proveedor');
    }
  };

  const openNewModal = () => {
    setCurrentProveedor({
      tipo_documento: '',
      nro_documento: '',
      nombre: '',
      ciudad: '',
      telefono: '',
      celular: '',
      email: '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600 text-sm sm:text-base">Administre la información de sus proveedores</p>
        </div>
        <Button onClick={openNewModal} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, documento o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterTipo} onValueChange={(value) => {
              setFilterTipo(value === "all" ? "" : value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="RUC">RUC</SelectItem>
                <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Lista de Proveedores
            </div>
            {!loading && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
                {proveedores.length} {proveedores.length === 1 ? 'Proveedor' : 'Proveedores'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Tipo Doc.</TableHead>
                      <TableHead className="font-semibold text-gray-700">Documento</TableHead>
                      <TableHead className="font-semibold text-gray-700">Nombre</TableHead>
                      <TableHead className="font-semibold text-gray-700">Ciudad</TableHead>
                      <TableHead className="font-semibold text-gray-700">Contacto</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="w-8 h-8 text-gray-300" />
                            <p>No hay proveedores registrados</p>
                            <Button onClick={openNewModal} variant="outline" size="sm">
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar primer proveedor
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      proveedores.map((proveedor) => (
                        <TableRow key={proveedor.id_proveedor}>
                        <TableCell>
                          {proveedor.tipo_documento ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              {proveedor.tipo_documento}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin tipo</span>
                          )}
                        </TableCell>
                          <TableCell className="font-medium">
                            {proveedor.nro_documento || '-'}
                          </TableCell>
                          <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                          <TableCell>
                            {proveedor.ciudad ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-3 h-3" />
                                {proveedor.ciudad}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {proveedor.telefono && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {proveedor.telefono}
                                </div>
                              )}
                              {proveedor.celular && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {proveedor.celular}
                                </div>
                              )}
                              {proveedor.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  {proveedor.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(proveedor)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDeleteId(proveedor.id_proveedor);
                                  setShowDeleteDialog(true);
                                }}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) {
          setCurrentProveedor({});
          setEditingId(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Tipo de documento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Documento</Label>
              <Select
                value={currentProveedor.tipo_documento || ''}
                onValueChange={(value) =>
                  setCurrentProveedor({ ...currentProveedor, tipo_documento: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Número de documento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Número de Documento</Label>
              <Input
                value={currentProveedor.nro_documento || ''}
                onChange={(e) =>
                  setCurrentProveedor({ ...currentProveedor, nro_documento: e.target.value })
                }
                placeholder="Número de documento"
                maxLength={currentProveedor.tipo_documento === 'DNI' ? 8 : 11}
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Nombre/Razón Social *</Label>
              <Input
                value={currentProveedor.nombre || ''}
                onChange={(e) =>
                  setCurrentProveedor({ ...currentProveedor, nombre: e.target.value })
                }
                placeholder="Nombre del proveedor o razón social"
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ciudad</Label>
              <Input
                value={currentProveedor.ciudad || ''}
                onChange={(e) =>
                  setCurrentProveedor({ ...currentProveedor, ciudad: e.target.value })
                }
                placeholder="Ciudad"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Teléfono</Label>
              <Input
                value={currentProveedor.telefono || ''}
                onChange={(e) =>
                  setCurrentProveedor({ ...currentProveedor, telefono: e.target.value })
                }
                placeholder="Teléfono fijo"
              />
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Celular</Label>
              <Input
                value={currentProveedor.celular || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 9);
                  setCurrentProveedor({ ...currentProveedor, celular: value });
                }}
                placeholder="Celular (9 dígitos)"
                maxLength={9}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={currentProveedor.email || ''}
                onChange={(e) =>
                  setCurrentProveedor({ ...currentProveedor, email: e.target.value })
                }
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingId ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingId ? 'Actualizar' : 'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
