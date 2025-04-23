"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";

export default function RegistrarEmpresa() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    ruc: "",
    razon_social: "",
    direccion: "",
    nombre_completo: "",
    usuario: "",
    contrasena: "",
    validar_contrasena: "",
  });

  const [loading, setLoading] = useState(false);
  const [rucValid, setRucValid] = useState(false);

  useEffect(() => {
    document.title = "Registrar Empresa";
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleValidateRUC = async () => {
    setLoading(true);

    if (formData.ruc.length !== 11) {
      toast.error("El RUC debe tener 11 dígitos.");
      setLoading(false);
      setRucValid(false);
      return;
    }

    const res = await fetch("/api/validar-ruc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruc: formData.ruc }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "No se pudo validar el RUC.");
      setRucValid(false);
    } else {
      setFormData({ ...formData, razon_social: data.razon_social, direccion: data.direccion });
      setRucValid(true);
      toast.success("RUC válido, datos completados.");
    }

    setLoading(false);
  };

  const isStep1Valid = () => {
    return (
      rucValid &&
      formData.razon_social.trim() !== "" &&
      formData.direccion.trim() !== ""
    );
  };

  const isStep2Valid = () => {
    return (
      formData.nombre_completo.trim() !== "" &&
      formData.usuario.trim() !== "" &&
      formData.contrasena.length >= 6 &&
      formData.contrasena === formData.validar_contrasena
    );
  };

  const goToNextStep = () => {
    if (currentStep === 1 && isStep1Valid()) {
      setCurrentStep(2);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    if (formData.contrasena !== formData.validar_contrasena) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
  
    setLoading(true);
  
    try {
      const res = await fetch("/api/registro_empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruc: formData.ruc,
          razon_social: formData.razon_social,
          direccion: formData.direccion,
          nombre_completo: formData.nombre_completo,
          usuario: formData.usuario,
          contrasena: formData.contrasena,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        toast.error(data.message || "Error al registrar la empresa.");
      } else {
        toast.success("Empresa registrada correctamente.");
        router.push("/auth"); // o redirige a donde necesites
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      toast.error("Error en la conexión con el servidor.");
    }
  
    setLoading(false);
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Registrar Empresa</CardTitle>
          <CardDescription className="text-center">
            {currentStep === 1 
              ? "Paso 1: Información de la empresa" 
              : "Paso 2: Datos del administrador"}
          </CardDescription>
          
          {/* Indicador de pasos */}
          <div className="flex justify-center items-center mt-4">
            <div className={`flex items-center justify-center rounded-full w-8 h-8 ${currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/20'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${currentStep === 2 ? 'bg-primary' : 'bg-primary/20'}`}></div>
            <div className={`flex items-center justify-center rounded-full w-8 h-8 ${currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-primary/20'}`}>
              2
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ruc"
                      name="ruc"
                      maxLength={11}
                      value={formData.ruc}
                      onChange={handleChange}
                      required
                    />
                    <Button 
                      type="button" 
                      onClick={handleValidateRUC} 
                      disabled={loading}
                      variant="secondary"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validando
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
                    name="razon_social" 
                    value={formData.razon_social} 
                    disabled 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input 
                    id="direccion"
                    name="direccion" 
                    value={formData.direccion} 
                    disabled 
                  />
                </div>
                
                <Button 
                  type="button" 
                  className="w-full mt-6" 
                  onClick={goToNextStep}
                  disabled={!isStep1Valid()}
                >
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre Completo</Label>
                  <Input 
                    id="nombre_completo"
                    name="nombre_completo" 
                    value={formData.nombre_completo}
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario</Label>
                  <Input 
                    id="usuario"
                    name="usuario" 
                    value={formData.usuario}
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contrasena">Contraseña</Label>
                    <Input 
                      id="contrasena"
                      type="password" 
                      name="contrasena" 
                      value={formData.contrasena}
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validar_contrasena">Confirmar</Label>
                    <Input 
                      id="validar_contrasena"
                      type="password" 
                      name="validar_contrasena" 
                      value={formData.validar_contrasena}
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToPreviousStep}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={!isStep2Valid()}
                  >
                    Finalizar Registro <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
