import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hash } from "bcryptjs";

// Extender el tipo User para incluir las propiedades necesarias
declare module "next-auth" {
  interface User {
    id_empresa?: number;
    id_rol?: number;
    rol?: string;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        // Para las consultas GET siempre requerimos autenticación
        const sessionGet = await getServerSession(req, res, authOptions);
  
        if (!sessionGet) {
          return res.status(401).json({ error: "No autorizado" });
        }

        // Obtener id_empresa del usuario actual
        const id_empresa = sessionGet.user?.id_empresa;
        
        // Para administradores del sistema, obtener todas las empresas
        // Para usuarios normales, solo obtener su empresa asignada
        let empresas;
        
        if (sessionGet.user?.rol === "ADMINISTRADOR") {
          empresas = await prisma.empresa.findMany();
        } else if (id_empresa) {
          empresas = await prisma.empresa.findMany({
            where: { id_empresa: Number(id_empresa) }
          });
        } else {
          return res.status(403).json({
            error: "Acceso denegado",
            details: "No tienes una empresa asignada"
          });
        }
        
        return res.status(200).json(empresas);
      
      case "POST":
        console.log("POST /api/empresas - Inicio del procesamiento");
        console.log("Body recibido:", JSON.stringify(req.body, null, 2));
        
        // Detectar si es registro inicial (primera empresa del sistema)
        // o si es una creación de empresa por un administrador existente
        
        // Primero verificamos si ya existen empresas en el sistema
        console.log("Verificando si hay empresas existentes...");
        const empresasExistentes = await prisma.empresa.count();
        const esRegistroInicial = empresasExistentes === 0;
        console.log(`Empresas existentes: ${empresasExistentes}, Es registro inicial: ${esRegistroInicial}`);
        
        // Si no es registro inicial, verificamos autenticación y permisos
        if (!esRegistroInicial) {
          console.log("No es registro inicial, verificando autenticación");
          const sessionPost = await getServerSession(req, res, authOptions);
          
          if (!sessionPost) {
            return res.status(401).json({ error: "No autorizado" });
          }
          
          // Solo permitir crear empresas a administradores del sistema
          if (sessionPost.user?.rol !== "ADMINISTRADOR") {
            return res.status(403).json({
              error: "Acceso denegado",
              details: "No tienes permisos para crear empresas"
            });
          }
        } else {
          console.log("Es registro inicial, no se requiere autenticación");
        }
        
        // Ahora procesamos la creación según el tipo de solicitud
        if (req.body.nombre_completo && req.body.usuario && req.body.contrasena) {
          console.log("Procesando creación con administrador");
          
          // Es un registro con administrador (aplicable tanto para registro inicial como para admin existente)
          const { ruc, razon_social, direccion, nombre_completo, usuario, contrasena } = req.body;
          
          // Validaciones básicas
          if (!razon_social || !ruc) {
            console.log("Error: Datos de empresa incompletos");
            return res.status(400).json({
              error: "Datos incompletos",
              details: "La razón social y RUC son obligatorios"
            });
          }
          
          if (!nombre_completo || !usuario || !contrasena) {
            console.log("Error: Datos de usuario incompletos");
            return res.status(400).json({
              error: "Datos incompletos",
              details: "Los datos del administrador son obligatorios"
            });
          }
          
          // Verificar si ya existe una empresa con el mismo RUC
          console.log(`Verificando si existe empresa con RUC ${ruc}`);
          const empresaExistente = await prisma.empresa.findFirst({
            where: { ruc }
          });
          
          if (empresaExistente) {
            console.log("Error: Empresa ya existe");
            return res.status(400).json({
              error: "Empresa ya registrada",
              details: `Ya existe una empresa con el RUC ${ruc}`
            });
          }
          
          // Verificar si el usuario ya existe
          console.log(`Verificando si existe usuario ${usuario}`);
          const usuarioExistente = await prisma.usuario.findFirst({
            where: { usuario }
          });
          
          if (usuarioExistente) {
            console.log("Error: Usuario ya existe");
            return res.status(400).json({
              error: "Usuario ya registrado",
              details: "El nombre de usuario ya está en uso"
            });
          }
          
          try {
            console.log("Iniciando transacción...");
            // Hashear la contraseña primero
            console.log("Hasheando contraseña...");
            const contrasenaString = String(contrasena);
            const hashedPassword = await hash(contrasenaString, 10);
            console.log("Contraseña hasheada correctamente");
            
            // Realizar todo en transacción
            const resultado = await prisma.$transaction(async (tx) => {
              console.log("Transacción iniciada");
              
              // 1. Crear la empresa
              console.log("1. Creando empresa...");
              const empresa = await tx.empresa.create({
                data: {
                  razon_social,
                  ruc,
                  direccion: direccion || ""
                }
              });
              console.log(`Empresa creada con ID: ${empresa.id_empresa}`);
              
              // 2. Crear el rol Administrador si es el registro inicial
              // o usar el rol estándar de Administrador si es una creación por admin existente
              let rolId;
              
              if (esRegistroInicial) {
                // Si es registro inicial, creamos el rol de Administrador
                console.log("2. Creando rol de Administrador...");
                const rol = await tx.rol.create({
                  data: {
                    id_empresa: empresa.id_empresa,
                    nombre: "ADMINISTRADOR",
                    descripcion: "Rol con acceso completo al sistema"
                  }
                });
                rolId = rol.id_rol;
                console.log(`Rol creado con ID: ${rolId}`);
              } else {
                // Si no es registro inicial, buscamos el rol de administrador existente
                console.log("2. Buscando rol de Administrador existente...");
                const rol = await tx.rol.findFirst({
                  where: { 
                    id_empresa: empresa.id_empresa,
                    nombre: "ADMINISTRADOR"
                  }
                });
                
                if (!rol) {
                  // Si no existe, lo creamos
                  console.log("Rol no encontrado, creando nuevo rol...");
                  const nuevoRol = await tx.rol.create({
                    data: {
                      id_empresa: empresa.id_empresa,
                      nombre: "ADMINISTRADOR",
                      descripcion: "Rol con acceso completo al sistema"
                    }
                  });
                  rolId = nuevoRol.id_rol;
                  console.log(`Nuevo rol creado con ID: ${rolId}`);
                } else {
                  rolId = rol.id_rol;
                  console.log(`Rol existente encontrado con ID: ${rolId}`);
                }
              }
              
              // 3. Crear el usuario administrador
              console.log("3. Creando usuario administrador...");
              const usuario_admin = await tx.usuario.create({
                data: {
                  nombre_completo,
                  usuario,
                  contrasena: hashedPassword,
                  id_empresa: empresa.id_empresa,
                  id_rol: rolId
                }
              });
              console.log(`Usuario creado con ID: ${usuario_admin.id_usuario}`);
              
              return {
                empresa: {
                  id: empresa.id_empresa,
                  ruc: empresa.ruc,
                  razon_social: empresa.razon_social
                },
                usuario: {
                  id: usuario_admin.id_usuario,
                  usuario: usuario_admin.usuario,
                  nombre_completo: usuario_admin.nombre_completo
                },
                registro_inicial: esRegistroInicial
              };
            });
            
            console.log("Transacción completada exitosamente");
            console.log("Resultado:", JSON.stringify(resultado, null, 2));
            
            return res.status(201).json({
              message: esRegistroInicial 
                ? "Empresa registrada exitosamente. Por favor inicie sesión con el usuario creado." 
                : "Empresa y administrador registrados correctamente",
              data: resultado
            });
          } catch (transactionError: any) {
            console.error("Error en transacción:", transactionError);
            return res.status(500).json({
              error: "Error al procesar el registro",
              details: transactionError.message
            });
          }
        } else {
          console.log("Procesando creación solo de empresa (sin administrador)");
          // Es solo creación de empresa (solo para administradores)
          // Este caso no aplica para registro inicial
          
          if (esRegistroInicial) {
            console.log("Error: Intento de crear empresa sin administrador en registro inicial");
            return res.status(400).json({
              error: "Datos incompletos",
              details: "Para el registro inicial se requiere crear un usuario administrador"
            });
          }
          
          const { razon_social, ruc, direccion, telefono, email, web } = req.body;
          
          // Validaciones básicas
          if (!razon_social || !ruc) {
            console.log("Error: Datos de empresa incompletos");
            return res.status(400).json({
              error: "Datos incompletos",
              details: "La razón social y RUC son obligatorios"
            });
          }
          
          // Verificar si ya existe una empresa con el mismo RUC
          const existente = await prisma.empresa.findFirst({
            where: { ruc }
          });
          
          if (existente) {
            console.log("Error: Empresa ya registrada");
            return res.status(400).json({
              error: "Empresa ya registrada",
              details: `Ya existe una empresa con el RUC ${ruc}`
            });
          }
          
          // Crear la empresa
          console.log("Creando empresa sin administrador...");
          const empresa = await prisma.empresa.create({
            data: {
              razon_social,
              ruc,
              direccion: direccion || "",
              telefono: telefono || "",
              email: email || "",
              web: web || ""
            }
          });
          console.log(`Empresa creada con ID: ${empresa.id_empresa}`);
          
          return res.status(201).json(empresa);
        }
        
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error("Error en controlador API:", error);
    // Enviar respuesta de error detallada
    return res.status(500).json({ 
      error: "Error interno del servidor", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Asegurarse de que Prisma se desconecte adecuadamente
    await prisma.$disconnect().catch(console.error);
  }
} 