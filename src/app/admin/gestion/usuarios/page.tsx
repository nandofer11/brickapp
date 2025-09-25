"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCog, PlusCircle, Trash2, Pencil, Save, X, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import { useAuth, AuthUser } from "@/hooks/useAuth";

// Interfaces para definir tipos
interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  usuario: string;
  contrasena?: string;
  email: string;
  celular: string;
  created_at?: string;
  id_rol: number;
  id_empresa: number;
  rol?: Rol;
  empresa?: Empresa;
}

interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
  id_empresa: number;
  empresa?: Empresa;
}

interface Permiso {
  id_permiso: number;
  nombre: string;
  descripcion: string;
  codigo: string;
  categoria: string;
}

interface Empresa {
  id_empresa: number;
  razon_social: string;
}

// COMPONENTE DE GESTIÓN DE USUARIOS
function GestionUsuarios() {
  const { user } = useAuth() as { user: AuthUser & { token?: string } }; // Obtener usuario de la sesión
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuario, setUsuario] = useState<Usuario>({
    id_usuario: 0,
    nombre_completo: '',
    usuario: '',
    contrasena: '',
    email: '',
    celular: '',
    id_rol: 0,
    id_empresa: user?.id_empresa || 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id_empresa) {
      fetchUsuarios();
      // fetchRoles();
    }
  }, [user]);

  // Actualizar id_empresa en el estado cuando el usuario se carga
  useEffect(() => {
    if (user?.id_empresa && !isEditing) {
      setUsuario(prev => ({
        ...prev,
        id_empresa: user.id_empresa
      }));
    }
  }, [user, isEditing]);

  const fetchUsuarios = async () => {
    // console.log("USER:", user);

    if (!user?.id_empresa) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/usuarios?id_empresa=${user.id_empresa}`);
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data); // Cambiar de setRoles a setUsuarios
      } else {
        toast.error("No se pudieron cargar los usuarios");
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar los usuarios");
    } finally {
      setIsLoading(false);
    }


    // if (!user?.id_empresa || !user?.token) {
    //   toast.error("Token no proporcionado o empresa no definida");
    //   return;
    // }

    // setIsLoading(true);
    // try {
    //   const response = await fetch(`/api/usuarios?id_empresa=${user.id_empresa}`, {
    //     headers: {
    //       Authorization: `Bearer ${user.token}`, // Asegurarse de que el token esté presente
    //     },
    //   });
    //   if (response.ok) {
    //     const data = await response.json();
    //     setUsuarios(data.map((usuario: any) => ({
    //       ...usuario,
    //       rol_nombre: usuario.rol?.nombre || "-", // Mapear el nombre del rol
    //     })));
    //   } else {
    //     const error = await response.json();
    //     toast.error(error.message || "No se pudieron cargar los usuarios");
    //   }
    // } catch (error) {
    //   console.error("Error al cargar usuarios:", error);
    //   toast.error("Error al cargar usuarios");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  // const fetchRoles = async () => {
  //   if (!user?.id_empresa) return;

  //   try {
  //     const response = await fetch(`/api/rol?id_empresa=${user.id_empresa}`, {
  //       headers: {
  //         Authorization: `Bearer ${user.token}`, // Agregar token al encabezado
  //       },
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setRoles(data);
  //     }
  //   } catch (error) {
  //     console.error("Error al cargar roles:", error);
  //     toast.error("Error al cargar roles");
  //   }
  // };

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas');
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      toast.error("Error al cargar empresas");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUsuario(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setUsuario(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const resetForm = () => {
    setUsuario({
      id_usuario: 0,
      nombre_completo: '',
      usuario: '',
      contrasena: '',
      email: '',
      celular: '',
      id_rol: 0,
      id_empresa: user?.id_empresa || 0 // Mantener id_empresa del usuario logueado
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id_empresa) {
      toast.error("No se pudo determinar la empresa del usuario");
      return;
    }

    try {
      const userData = {
        ...usuario,
        id_empresa: user.id_empresa,
      };

      const url = isEditing
        ? `/api/usuarios?id_empresa=${user.id_empresa}` // Cambiar a /api/usuarios
        : `/api/usuarios?id_empresa=${user.id_empresa}`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // Agregar token al encabezado
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast.success(`Usuario ${isEditing ? "actualizado" : "creado"} correctamente`);
        fetchUsuarios();
        setDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.message || `Error ${response.status}: ${response.statusText}`);
        return;
      }
    } catch (error: any) {
      toast.error(error.message || "Error al guardar usuario");
    }
  };

  const handleEdit = (user: Usuario) => {
    // Al editar, no modificar id_empresa
    setUsuario({
      ...user,
      contrasena: ''
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!user?.id_empresa) {
      toast.error("No se pudo determinar la empresa del usuario");
      return;
    }

    if (confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        const response = await fetch(`/api/usuarios/${id}?id_empresa=${user.id_empresa}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success("Usuario eliminado correctamente");
          fetchUsuarios();
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Error al eliminar usuario');
        }
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar usuario");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Lista de Usuarios</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsuarios}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setIsEditing(false);
              }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
                </DialogTitle>
                <DialogDescription>
                  Complete el formulario para {isEditing ? "actualizar el" : "crear un nuevo"} usuario.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_completo">Nombre Completo</Label>
                    <Input 
                      id="nombre_completo" 
                      name="nombre_completo" 
                      value={usuario.nombre_completo} 
                      onChange={handleInputChange} 
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usuario">Nombre de Usuario</Label>
                    <Input 
                      id="usuario" 
                      name="usuario" 
                      value={usuario.usuario} 
                      onChange={handleInputChange} 
                      placeholder="Nombre de usuario"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contraseña">Contraseña {isEditing && "(Dejar en blanco para mantener la actual)"}</Label>
                  <Input 
                    id="contraseña" 
                    name="contraseña" 
                    type="password" 
                    value={usuario.contrasena} 
                    onChange={handleInputChange} 
                    placeholder="Contraseña"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={usuario.email} 
                      onChange={handleInputChange} 
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input 
                      id="celular" 
                      name="celular" 
                      value={usuario.celular} 
                      onChange={handleInputChange} 
                      placeholder="Número de celular"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_rol">Rol</Label>
                  <Select 
                    value={usuario.id_rol ? usuario.id_rol.toString() : undefined} 
                    onValueChange={(value) => handleSelectChange(value, "id_rol")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((rol) => (
                        <SelectItem key={rol.id_rol} value={rol.id_rol.toString()}>
                          {rol.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Eliminamos el campo id_empresa ya que se obtiene de la sesión */}

              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((user) => (
                <TableRow key={user.id_usuario}>
                  <TableCell>{user.nombre_completo}</TableCell>
                  <TableCell>{user.usuario}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>{user.celular || "-"}</TableCell>
                  <TableCell>{user.rol?.nombre}</TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id_usuario)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
  );
}

// COMPONENTE DE GESTIÓN DE ROLES Y PERMISOS
function GestionRolesPermisos() {
  const { user } = useAuth(); // Obtener usuario de la sesión
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [rol, setRol] = useState<Rol>({
    id_rol: 0,
    nombre: '',
    descripcion: '',
    id_empresa: user?.id_empresa || 0,
  });
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [rolPermisos, setRolPermisos] = useState<number[]>([]);
  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([]); // Para el modal de crear/editar
  const [openTooltip, setOpenTooltip] = useState<number | null>(null); // Para controlar qué tooltip está abierto
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id_empresa) {
      fetchRoles();
      fetchPermisos();
    }
  }, [user]);

  // Actualizar id_empresa en el estado cuando el usuario se carga
  useEffect(() => {
    if (user?.id_empresa && !isEditing) {
      setRol(prev => ({
        ...prev,
        id_empresa: user.id_empresa
      }));
    }
  }, [user, isEditing]);

  const fetchRoles = async () => {
    if (!user?.id_empresa) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rol?id_empresa=${user.id_empresa}`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        
        // Seleccionar automáticamente el primer rol si existe
        if (data.length > 0 && !selectedRol) {
          setSelectedRol(data[0]);
          fetchRolPermisos(data[0].id_rol);
        }
      } else {
        toast.error("No se pudieron cargar los roles");
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
      toast.error("Error al cargar los roles");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermisos = async () => {
    try {
      const response = await fetch('/api/permisos');
      if (response.ok) {
        const data = await response.json();
        setPermisos(data);
      }
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      toast.error("Error al cargar los permisos");
    }
  };

  const fetchRolPermisos = async (id: number) => {
    if (!user?.id_empresa) return;
    
    try {
      const response = await fetch(`/api/roles-permisos/${id}/permisos`);
      if (response.ok) {
        const data = await response.json();
        // Extraer los IDs de permisos desde rol_permiso
        const permissionIds = data.rol_permiso?.map((rp: any) => rp.id_permiso) || [];
        setRolPermisos(permissionIds);
      }
    } catch (error) {
      console.error("Error al cargar permisos del rol:", error);
      toast.error("Error al cargar permisos del rol");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRol(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setRol({
      id_rol: 0,
      nombre: '',
      descripcion: '',
      id_empresa: user?.id_empresa || 0
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id_empresa) {
      toast.error("No se pudo determinar la empresa del usuario");
      return;
    }

    try {
      // Asegurar que el id_empresa sea el del usuario logueado
      const rolData = {
        id_rol: rol.id_rol, // Asegurarse de incluir el ID del rol
        nombre: rol.nombre.trim(), // Validar que el nombre no tenga espacios innecesarios
        descripcion: rol.descripcion.trim(), // Validar que la descripción no tenga espacios innecesarios
        id_empresa: user.id_empresa,
      };

      const url = isEditing 
        ? `/api/rol?id_empresa=${user.id_empresa}` // Cambiar a un único endpoint
        : `/api/rol?id_empresa=${user.id_empresa}`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rolData),
      });

      if (response.ok) {
        const savedRol = await response.json();
        
        toast.success(`Rol ${isEditing ? 'actualizado' : 'creado'} correctamente`);
        
        // Si estamos creando un nuevo rol, seleccionarlo automáticamente para asignar permisos
        if (!isEditing && savedRol) {
          setSelectedRol(savedRol);
          setRolPermisos([]);
        }
        
        fetchRoles();
        setDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar rol');
      }
    } catch (error: any) {
      toast.error(error.message || "Error al guardar rol");
    }
  };

  const handleEdit = (role: Rol) => {
    setRol({
      id_rol: role.id_rol,
      nombre: role.nombre,
      descripcion: role.descripcion,
      id_empresa: role.id_empresa,
    });
    
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handlePermissionToggle = (permisoId: number, isChecked: boolean) => {
    setSelectedPermisos(prev => {
      if (isChecked) {
        return [...prev, permisoId];
      } else {
        return prev.filter(id => id !== permisoId);
      }
    });
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permiso[]> = {};
    permisos.forEach(permiso => {
      const category = (permiso as any).categoria || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permiso);
    });
    return categories;
  };

  const handleTooltipToggle = (permisoId: number) => {
    setOpenTooltip(prev => prev === permisoId ? null : permisoId);
  };

  const handleDelete = async () => {
    if (!user?.id_empresa || roleToDelete === null) {
      toast.error("No se pudo determinar la empresa del usuario o el rol a eliminar");
      return;
    }

    console.log("Role to delete:", roleToDelete); // Depuración para verificar el ID del rol
    console.log("User empresa ID:", user.id_empresa); // Depuración para verificar el ID de la empresa

    const url = `/api/rol/${roleToDelete}`;
    console.log("DELETE URL:", url); // Depuración para verificar la URL

    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Rol eliminado correctamente");
        
        // Si el rol eliminado era el seleccionado, limpiar la selección
        if (selectedRol?.id_rol === roleToDelete) {
          setSelectedRol(null);
          setRolPermisos([]);
        }
        
        // Recargar roles (que automáticamente seleccionará el primer rol disponible)
        fetchRoles();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar rol');
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar rol");
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleSelectRol = (role: Rol) => {
    setSelectedRol(role);
    fetchRolPermisos(role.id_rol);
  };

  const handlePermissionChange = async (id_permiso: number, checked: boolean) => {
    if (!selectedRol) return;

    try {
      // Actualizar localmente primero para mejor UX
      let newPermissions;
      if (checked) {
        newPermissions = [...rolPermisos, id_permiso];
      } else {
        newPermissions = rolPermisos.filter(id => id !== id_permiso);
      }
      
      setRolPermisos(newPermissions);

      // Actualizar en el servidor
      const response = await fetch(`/api/roles-permisos/${selectedRol.id_rol}/permisos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permisoIds: newPermissions }),
      });

      if (response.ok) {
        toast.success(`Permiso ${checked ? 'añadido al' : 'removido del'} rol`);
      } else {
        const error = await response.json();
        // Revertir cambio local si falló
        setRolPermisos(rolPermisos);
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar permisos");
    }
  };

  const handleSelectAllPermissions = async () => {
    if (!selectedRol) return;

    try {
      const allPermissionIds = permisos.map(p => p.id_permiso);
      setRolPermisos(allPermissionIds);

      const response = await fetch(`/api/roles-permisos/${selectedRol.id_rol}/permisos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permisoIds: allPermissionIds }),
      });

      if (response.ok) {
        toast.success("Todos los permisos han sido asignados al rol");
      } else {
        const error = await response.json();
        setRolPermisos(rolPermisos); // Revertir cambio local si falló
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al asignar todos los permisos");
    }
  };

  const handleClearAllPermissions = async () => {
    if (!selectedRol) return;

    try {
      setRolPermisos([]);

      const response = await fetch(`/api/roles-permisos/${selectedRol.id_rol}/permisos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permisoIds: [] }),
      });

      if (response.ok) {
        toast.success("Todos los permisos han sido removidos del rol");
      } else {
        const error = await response.json();
        setRolPermisos(rolPermisos); // Revertir cambio local si falló
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al remover todos los permisos");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Roles</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}> 
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => {
                resetForm();
                setIsEditing(false);
              }}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Editar Rol" : "Crear Nuevo Rol"}
                </DialogTitle>
                <DialogDescription>
                  Complete el formulario para {isEditing ? "actualizar el" : "crear un nuevo"} rol. Los permisos se asignan desde el panel de gestión de permisos.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Rol</Label>
                  <Input 
                    id="nombre" 
                    name="nombre" 
                    value={rol.nombre} 
                    onChange={handleInputChange} 
                    placeholder="Nombre del rol"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input 
                    id="descripcion" 
                    name="descripcion" 
                    value={rol.descripcion} 
                    onChange={handleInputChange} 
                    placeholder="Descripción del rol"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8">No hay roles disponibles</div>
        ) : (
          <div className="space-y-2">
            {roles.map((role) => (
              <div 
                key={role.id_rol} 
                className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                  selectedRol?.id_rol === role.id_rol 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleSelectRol(role)}
              >
                <div>
                  <div className="font-medium">{role.nombre}</div>
                  <div className="text-sm opacity-70">{role.descripcion || 'Sin descripción'}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(role);
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setRoleToDelete(role.id_rol);
                    setDeleteDialogOpen(true);
                  }}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-2 border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">
          {selectedRol 
            ? `Permisos para: ${selectedRol.nombre}` 
            : "Seleccione un rol para gestionar sus permisos"}
        </h3>

        {!selectedRol ? (
          <div className="text-center py-12 text-muted-foreground">
            Seleccione un rol de la lista para ver y asignar permisos
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                <div key={category} className="border rounded-lg p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:shadow-sm transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                    <h4 className="font-semibold text-sm text-primary">
                      {category}
                    </h4>
                  </div>
                  <div className="space-y-0">
                    {categoryPermissions.map((permiso) => (
                      <div key={permiso.id_permiso} className="flex items-start space-x-2 p-0.5 rounded-md hover:bg-white/60 transition-colors">
                        <Checkbox
                          id={`manage-permission-${permiso.id_permiso}`}
                          checked={rolPermisos.includes(permiso.id_permiso)}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permiso.id_permiso, !!checked)
                          }
                          className="mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <Label 
                              htmlFor={`manage-permission-${permiso.id_permiso}`}
                              className="text-xs font-medium cursor-pointer leading-tight text-slate-800"
                            >
                              {permiso.nombre}
                            </Label>
                            <TooltipProvider>
                              <Tooltip open={openTooltip === permiso.id_permiso} onOpenChange={() => {}}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex-shrink-0 ml-1 p-0.5 hover:bg-slate-300 rounded-full transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleTooltipToggle(permiso.id_permiso);
                                    }}
                                  >
                                    <Info className="h-3 w-3 text-slate-500 hover:text-slate-700" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="top" 
                                  className="max-w-xs bg-slate-800 text-slate-100 border-slate-700"
                                >
                                  <p className="text-sm">{permiso.descripcion}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Sección de control y estadísticas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t bg-slate-50/30 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-slate-700">
                  {rolPermisos.length} permisos seleccionados
                </span>
                <span className="text-xs text-muted-foreground">
                  de {permisos.length} disponibles
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllPermissions}
                  className="text-xs"
                >
                  Seleccionar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllPermissions}
                  className="text-xs"
                >
                  Limpiar Selección
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este rol? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsuariosPage() {
  const [activeTab, setActiveTab] = useState("usuarios");

  useEffect(() => {
    document.title = "Gestión de Usuarios";
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios y Roles</h1>
      
      <Tabs defaultValue="usuarios" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span>Roles y Permisos</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Crear, editar, eliminar y asignar roles a los usuarios del sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GestionUsuarios />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Roles y Permisos</CardTitle>
                <CardDescription>
                  Administra los roles del sistema y asigna permisos a cada rol.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GestionRolesPermisos />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
