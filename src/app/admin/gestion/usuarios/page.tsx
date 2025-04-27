"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCog, PlusCircle, Trash2, Pencil, Save, X, RefreshCw } from "lucide-react";
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
    if (!user?.id_empresa || !user?.token) {
      toast.error("Token no proporcionado o empresa no definida");
      return;
    }

    console.log("Usuario", user);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/usuarios?id_empresa=${user.id_empresa}`, {
        headers: {
          Authorization: `Bearer ${user.token}`, // Asegurarse de que el token esté presente
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        const error = await response.json();
        toast.error(error.message || "No se pudieron cargar los usuarios");
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
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
        ? `/api/usuarios/${usuario.id_usuario}?id_empresa=${user.id_empresa}`
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
        throw new Error(error.message || "Error al guardar usuario");
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
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((user) => (
                <TableRow key={user.id_usuario}>
                  <TableCell>{user.nombre_completo}</TableCell>
                  <TableCell>{user.usuario}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>{user.rol?.nombre || "-"}</TableCell>
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await fetch(`/api/roles/${id}/permisos?id_empresa=${user.id_empresa}`);
      if (response.ok) {
        const data = await response.json();
        setRolPermisos(data.map((p: { id_permiso: number }) => p.id_permiso));
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
        ...rol,
        id_empresa: user.id_empresa
      };

      const url = isEditing 
        ? `/api/roles/${rol.id_rol}?id_empresa=${user.id_empresa}` 
        : `/api/roles?id_empresa=${user.id_empresa}`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rolData)
      });

      if (response.ok) {
        toast.success(`Rol ${isEditing ? 'actualizado' : 'creado'} correctamente`);
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
      ...role,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!user?.id_empresa) {
      toast.error("No se pudo determinar la empresa del usuario");
      return;
    }

    if (confirm('¿Está seguro de eliminar este rol?')) {
      try {
        const response = await fetch(`/api/roles/${id}?id_empresa=${user.id_empresa}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success("Rol eliminado correctamente");
          fetchRoles();
          if (selectedRol?.id_rol === id) {
            setSelectedRol(null);
          }
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Error al eliminar rol');
        }
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar rol");
      }
    }
  };

  const handleSelectRol = (role: Rol) => {
    setSelectedRol(role);
    fetchRolPermisos(role.id_rol);
  };

  const handlePermissionChange = async (id_permiso: number, checked: boolean) => {
    if (!selectedRol || !user?.id_empresa) return;

    try {
      const method = checked ? 'POST' : 'DELETE';
      const url = `/api/roles/${selectedRol.id_rol}/permisos/${id_permiso}?id_empresa=${user.id_empresa}`;

      const response = await fetch(url, { method });

      if (response.ok) {
        toast.success(`Permiso ${checked ? 'añadido al' : 'removido del'} rol`);
        
        // Actualizar localmente los permisos
        if (checked) {
          setRolPermisos(prev => [...prev, id_permiso]);
        } else {
          setRolPermisos(prev => prev.filter(id => id !== id_permiso));
        }
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar permisos");
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Editar Rol" : "Crear Nuevo Rol"}
                </DialogTitle>
                <DialogDescription>
                  Complete el formulario para {isEditing ? "actualizar el" : "crear un nuevo"} rol.
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
                    handleDelete(role.id_rol);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permisos.map((permiso) => (
              <div key={permiso.id_permiso} className="flex items-center space-x-2 p-3 border rounded-md">
                <Checkbox 
                  id={`permiso-${permiso.id_permiso}`} 
                  checked={rolPermisos.includes(permiso.id_permiso)}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(permiso.id_permiso, checked === true)
                  }
                />
                <div className="grid gap-1.5">
                  <Label htmlFor={`permiso-${permiso.id_permiso}`}>
                    {permiso.nombre}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {permiso.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
