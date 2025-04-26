"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-toastify"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Obtener la URL de callback si existe
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin/dashboard"

  useEffect(() => {
    document.title = "Iniciar Sesión"
    
    // Verificar si ya estamos autenticados
    if (status === "authenticated" && session) {
      console.log("Usuario ya autenticado:", session.user)
      toast.info("Ya has iniciado sesión")
      router.push("/admin/dashboard")
    }
  }, [status, session, router])

  // Mostrar información de depuración en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Estado de autenticación:", status)
      console.log("URL de callback:", callbackUrl)
      
      // Verificar cookies en el navegador
      console.log("Cookies disponibles:", document.cookie)
    }
  }, [status, callbackUrl])

  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("Usuario autenticado:", session.user);

      // Redirigir según el rol del usuario
      if (session.user.id_rol === 1) { // Ejemplo: rol ADMINISTRADOR
        router.push("/admin/dashboard");
      } else {
        router.push("/"); // Redirigir a la página pública
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
    const result = await signIn("credentials", {
      usuario,
      contrasena,
        redirect: false,
        callbackUrl
    })

      console.log("Resultado de signIn:", result)

    if (result?.error) {
        setError(result.error)
        toast.error(result.error || "Error al iniciar sesión")
      } else if (result?.ok) {
        // Verificar si la sesión se creó correctamente
        const session = await getSession()
        console.log("✅ Usuario autenticado:", session?.user)
        
        if (session) {
          toast.success("Inicio de sesión exitoso 🎉")
          router.push(callbackUrl)
        } else {
          console.error("La sesión no se creó correctamente")
          toast.error("Error al iniciar sesión: la sesión no se creó correctamente")
        }
      }
    } catch (err) {
      console.error("Error durante el inicio de sesión:", err)
      toast.error("Error inesperado durante el inicio de sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm space-y-6">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  placeholder="Ingresa tu usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center w-full space-y-1">
              <Link href="/registrar_empresa" className="text-sm text-primary hover:underline block">
                Registrar Empresa
              </Link>
              <Link href="/" className="text-sm text-primary hover:underline block">
                Inicio
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground">Brickapp © 2025 - Versión 1.0</p>
      </div>
    </div>
  )
}

