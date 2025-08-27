"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useAuthContext } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash, Save, Loader2, Building, Upload, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Interfaces para los datos
interface NumeracionComprobante {
  id_numeracion_comprobante?: number;
  tipo_comprobante: string;
  serie: string;
  numero_actual: number;
  id_empresa: number;
}

interface EmpresaData {
  id_empresa: number;
  razon_social: string;
  ruc: string;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  logo?: string | null;
}

export default function ConfiguracionPage() {
  const { empresa } = useAuthContext();
  const [activeTab, setActiveTab] = useState("comprobante");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para numeración de comprobantes
  const [numeracionComprobantes, setNumeracionComprobantes] = useState<NumeracionComprobante[]>([]);
  const [numeracionComprobanteSeleccionado, setNumeracionComprobanteSeleccionado] = useState<NumeracionComprobante | null>(null);
  const [isLoadingComprobante, setIsLoadingComprobante] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para el formulario de comprobante
  const [formData, setFormData] = useState<NumeracionComprobante>({
    tipo_comprobante: "BOLETA",
    serie: "",
    numero_actual: 1,
    id_empresa: empresa?.id_empresa || 0
  });

  // Estados para la empresa
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [isLoadingEmpresa, setIsLoadingEmpresa] = useState(true);
  const [isEditingEmpresa, setIsEditingEmpresa] = useState(false);
  const [isSubmittingEmpresa, setIsSubmittingEmpresa] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Verificar si el logo predeterminado existe
  const checkDefaultLogo = async () => {
    try {
      const response = await fetch("/images/logos/logo_color.png", { method: 'HEAD' });
      if (!response.ok) {
        console.error("El logo predeterminado no existe en la ruta especificada");
      }
    } catch (error) {
      console.error("Error al verificar el logo predeterminado:", error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (empresa?.id_empresa) {
      fetchNumeracionComprobante();
      fetchEmpresaData();
      checkDefaultLogo();
    }
  }, [empresa?.id_empresa]);

  const fetchNumeracionComprobante = async () => {
    try {
      setIsLoadingComprobante(true);
      const response = await fetch("/api/numeracion_comprobante");
      
      if (!response.ok) {
        if (response.status === 404) {
          // No hay configuración previa, dejamos el estado como un array vacío
          setNumeracionComprobantes([]);
        } else {
          throw new Error("Error al cargar la numeración de comprobantes");
        }
      } else {
        const data = await response.json();
        // Verificar si la respuesta es un array o un objeto único
        if (Array.isArray(data)) {
          setNumeracionComprobantes(data);
          // Si hay comprobantes, seleccionamos el primero por defecto
          if (data.length > 0) {
            setNumeracionComprobanteSeleccionado(data[0]);
          } else {
            setNumeracionComprobanteSeleccionado(null);
          }
        } else {
          // Si la API devuelve un objeto único, convertirlo en array
          setNumeracionComprobantes([data]);
          setNumeracionComprobanteSeleccionado(data);
        }
      }
    } catch (error) {
      console.error("Error al cargar la numeración de comprobantes:", error);
      toast.error("Error al cargar la configuración de comprobantes");
      setNumeracionComprobantes([]);
      setNumeracionComprobanteSeleccionado(null);
    } finally {
      setIsLoadingComprobante(false);
    }
  };

  // Función para cargar los datos de la empresa
  const fetchEmpresaData = async () => {
    if (!empresa?.id_empresa) return;
    
    try {
      setIsLoadingEmpresa(true);
      const response = await fetch(`/api/empresas?id=${empresa.id_empresa}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar los datos de la empresa");
      }
      
      const data = await response.json();
      // Si la respuesta es un array, tomamos el primer elemento
      const empresaInfo = Array.isArray(data) && data.length > 0 ? data[0] : data;
      
      setEmpresaData(empresaInfo);
      
      // Si la empresa tiene logo, establecer la vista previa
      if (empresaInfo?.logo) {
        setLogoPreview(empresaInfo.logo);
      }
    } catch (error) {
      console.error("Error al cargar datos de la empresa:", error);
      toast.error("Error al cargar los datos de la empresa");
    } finally {
      setIsLoadingEmpresa(false);
    }
  };

  const handleOpenForm = (edit: boolean = false, comprobante?: NumeracionComprobante) => {
    setEditMode(edit);
    if (edit && comprobante) {
      setFormData({
        id_numeracion_comprobante: comprobante.id_numeracion_comprobante,
        tipo_comprobante: comprobante.tipo_comprobante,
        serie: comprobante.serie,
        numero_actual: comprobante.numero_actual,
        id_empresa: comprobante.id_empresa
      });
      setNumeracionComprobanteSeleccionado(comprobante);
    } else {
      // Para nuevo comprobante
      setFormData({
        tipo_comprobante: "BOLETA",
        serie: "",
        numero_actual: 1,
        id_empresa: empresa?.id_empresa || 0
      });
    }
    setFormDialog(true);
  };

  // Modificar la función handleFormChange para manejar la conversión a mayúsculas
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si es el campo tipo_comprobante, convertir a mayúsculas
    if (name === "tipo_comprobante") {
      setFormData({
        ...formData,
        [name]: value.toUpperCase()
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === "numero_actual" ? parseInt(value) : value
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const url = "/api/numeracion_comprobante";
      const method = editMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(editMode ? "Error al actualizar" : "Error al crear");
      }
      
      const data = await response.json();
      // Refrescar la lista completa de comprobantes
      await fetchNumeracionComprobante();
      toast.success(editMode ? "Configuración actualizada correctamente" : "Configuración creada correctamente");
      setFormDialog(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error(editMode ? "Error al actualizar la configuración" : "Error al crear la configuración");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!numeracionComprobanteSeleccionado?.id_numeracion_comprobante) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/numeracion_comprobante?id=${numeracionComprobanteSeleccionado.id_numeracion_comprobante}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar");
      }
      
      // Refrescar la lista completa después de eliminar
      await fetchNumeracionComprobante();
      toast.success("Configuración eliminada correctamente");
      setDeleteDialog(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar la configuración");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para manejar cambios en el formulario de empresa
  const handleEmpresaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (empresaData) {
      setEmpresaData({
        ...empresaData,
        [name]: value
      });
    }
  };

  // Función para manejar la selección de archivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, seleccione una imagen válida');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 2MB');
      return;
    }

    setLogoFile(file);
    
    // Crear URL para vista previa
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);

    // Limpiar la URL al desmontar
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Función para iniciar la carga del archivo
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Función para actualizar datos de la empresa con imagen
  const handleUpdateEmpresa = async () => {
    if (!empresaData || !empresa?.id_empresa) return;
    
    try {
      setIsSubmittingEmpresa(true);
      
      // Preparar los datos para actualizar
      const dataToUpdate = {
        id_empresa: empresaData.id_empresa,
        ciudad: empresaData.ciudad,
        telefono: empresaData.telefono,
        email: empresaData.email,
        web: empresaData.web
      };
      
      // Si hay un archivo de logo nuevo, lo procesamos
      if (logoFile) {
        // Convertir la imagen a base64 para enviarla como parte de la actualización
        const base64Logo = await convertFileToBase64(logoFile);
        
        // Añadir el logo en base64 a los datos de actualización
        Object.assign(dataToUpdate, { logo: base64Logo });
      } 
      // Si se quiere usar el logo por defecto
      else if (logoPreview === "default") {
        // Indicar que queremos usar el logo por defecto
        Object.assign(dataToUpdate, { logo: "default_logo" });
      }
      
      // Actualizar los datos de la empresa
      const response = await fetch(`/api/empresas/${empresaData.id_empresa}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToUpdate)
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar los datos de la empresa");
      }
      
      const updatedData = await response.json();
      setEmpresaData(updatedData);
      
      toast.success("Datos de la empresa actualizados correctamente");
      setIsEditingEmpresa(false);
      setLogoFile(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar los datos de la empresa");
    } finally {
      setIsSubmittingEmpresa(false);
    }
  };

  // Función para convertir archivo a base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="flex flex-col flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">
          Administre las configuraciones generales del sistema.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="comprobante">Comprobantes</TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="comprobante" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Numeración de Comprobantes</CardTitle>
                <CardDescription>
                  Configure la serie y numeración de los comprobantes emitidos.
                </CardDescription>
              </div>
              <Button 
                onClick={() => handleOpenForm(false)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingComprobante ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : numeracionComprobantes.length > 0 ? (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Comprobante</TableHead>
                        <TableHead>Serie</TableHead>
                        <TableHead>Número Actual</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {numeracionComprobantes.map((comprobante) => (
                        <TableRow key={comprobante.id_numeracion_comprobante}>
                          <TableCell>{comprobante.tipo_comprobante}</TableCell>
                          <TableCell>{comprobante.serie}</TableCell>
                          <TableCell>{comprobante.numero_actual}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleOpenForm(true, comprobante)}
                              >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setNumeracionComprobanteSeleccionado(comprobante);
                                setDeleteDialog(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">
                    No hay configuración de numeración de comprobantes.
                  </p>
                  <Button onClick={() => handleOpenForm(false)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Configurar ahora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos de la Empresa</CardTitle>
                <CardDescription>
                  Actualice la información de contacto de su empresa.
                </CardDescription>
              </div>
              {!isEditingEmpresa ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingEmpresa(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Información
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      fetchEmpresaData();
                      setIsEditingEmpresa(false);
                      setLogoFile(null);
                      setLogoPreview(empresaData?.logo || null);
                    }}
                    disabled={isSubmittingEmpresa}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpdateEmpresa}
                    disabled={isSubmittingEmpresa}
                  >
                    {isSubmittingEmpresa ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingEmpresa ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : empresaData ? (
                <div className="space-y-6">
                  {/* Logo de la empresa */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="mb-4">
                      {logoPreview ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-md bg-white">
                          <img 
                            src={logoPreview.startsWith('data:') ? logoPreview : logoPreview}
                            alt="Logo de la empresa" 
                            className="w-full h-full object-contain p-2"
                          />
                          {/* Mostrar badge si es el logo predeterminado */}
                          {logoPreview === "/images/logos/logo_color.png" && (
                            <div className="absolute bottom-0 right-0 bg-primary text-white text-xs px-2 py-1 rounded-tl-md">
                              Predeterminado
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-lg shadow-md">
                          <Building className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {isEditingEmpresa && (
                      <div className="flex flex-col items-center">
                        <div className="flex space-x-2 mb-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleUploadClick}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {logoPreview ? "Cambiar Logo" : "Subir Logo"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview("/images/logos/logo_color.png");
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Usar Logo Predeterminado
                          </Button>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                          style={{ display: 'none' }}
                          accept="image/*"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formatos: JPG, PNG, GIF. Máximo 2MB.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Información no editable */}
                  <div className="bg-muted/30 p-4 rounded-md mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Información Básica (No Editable)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="razon_social">Razón Social</Label>
                        <Input 
                          id="razon_social"
                          value={empresaData.razon_social}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ruc">RUC</Label>
                        <Input 
                          id="ruc"
                          value={empresaData.ruc}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input 
                          id="direccion"
                          value={empresaData.direccion || ''}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Información editable */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Información de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ciudad">Ciudad</Label>
                        <Input 
                          id="ciudad"
                          name="ciudad"
                          value={empresaData.ciudad || ''}
                          onChange={handleEmpresaInputChange}
                          readOnly={!isEditingEmpresa}
                          disabled={!isEditingEmpresa || isSubmittingEmpresa}
                          placeholder="Ingrese la ciudad"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input 
                          id="telefono"
                          name="telefono"
                          value={empresaData.telefono || ''}
                          onChange={handleEmpresaInputChange}
                          readOnly={!isEditingEmpresa}
                          disabled={!isEditingEmpresa || isSubmittingEmpresa}
                          placeholder="Ej: 987654321"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email"
                          name="email"
                          type="email"
                          value={empresaData.email || ''}
                          onChange={handleEmpresaInputChange}
                          readOnly={!isEditingEmpresa}
                          disabled={!isEditingEmpresa || isSubmittingEmpresa}
                          placeholder="empresa@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="web">Sitio Web</Label>
                        <Input 
                          id="web"
                          name="web"
                          value={empresaData.web || ''}
                          onChange={handleEmpresaInputChange}
                          readOnly={!isEditingEmpresa}
                          disabled={!isEditingEmpresa || isSubmittingEmpresa}
                          placeholder="www.miempresa.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Building className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">
                    No se encontraron datos de la empresa.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para crear/editar numeración de comprobante */}
      <Dialog open={formDialog} onOpenChange={setFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Configuración" : "Nueva Configuración"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Modifique los datos de configuración de numeración de comprobantes."
                : "Complete los detalles para configurar la numeración de comprobantes."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante</Label>
              {/* Reemplazar el Select por un Input */}
              <Input
                id="tipo_comprobante"
                name="tipo_comprobante"
                placeholder="Ej: BOLETA, FACTURA, TICKET"
                value={formData.tipo_comprobante}
                onChange={handleFormChange}
                required
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serie">Serie</Label>
              <Input
                id="serie"
                name="serie"
                placeholder="Ej: B001"
                value={formData.serie}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_actual">Número Actual</Label>
              <Input
                id="numero_actual"
                name="numero_actual"
                type="number"
                placeholder="Ej: 1"
                min="0"
                value={formData.numero_actual}
                onChange={handleFormChange}
                required
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editMode ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editMode ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar eliminación */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Eliminará permanentemente la configuración
              de numeración de comprobantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
