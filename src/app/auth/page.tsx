"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    document.title = "Iniciar Sesión"
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // toast.error("Esto es una prueba de error");

    const result = await signIn("credentials", {
      usuario,
      contraseña,
      redirect: false, // No redirigir automáticamente
    })

    console.log("Resultado de signIn:", result) // 👀 Verifica qué devuelve

    if (result?.error) {
      toast.error("Usuario o contraseña incorrectos")
      setLoading(false)
    } else {
      const session = await getSession()
      console.log("✅ Usuario autenticado:", session?.user)
      toast.success("Inicio de sesión exitoso 🎉")
      router.push("/admin/dashboard")
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
                <Label htmlFor="contraseña">Contraseña</Label>
                <Input
                  id="contraseña"
                  type="password"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
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

