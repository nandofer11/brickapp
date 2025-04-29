import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    // Validar que el cuerpo de la solicitud no sea nulo o vacío
    if (!req.body) {
      return res.status(400).json({ message: "El cuerpo de la solicitud no puede estar vacío." });
    }

    // Parsear el cuerpo de la solicitud
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Validar que el cuerpo sea un objeto
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ message: "El cuerpo de la solicitud debe ser un objeto JSON válido." });
    }

    const { ruc, razon_social, direccion, nombre_completo, usuario, contrasena } = body;

    // Validaciones
    if (!ruc || ruc.length !== 11) {
      return res.status(400).json({ message: "El RUC debe tener 11 dígitos." });
    }

    if (!direccion || direccion.length > 255) { // Suponiendo que la longitud máxima permitida es 255
      return res.status(400).json({ message: "La dirección no puede exceder los 255 caracteres." });
    }

    // Usar transacción para todas las operaciones
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Crear empresa
      const nuevaEmpresa = await prisma.empresa.create({
        data: {
          ruc,
          razon_social,
          direccion
        }
      });

      // 2. Crear rol ADMIN
      const rolAdmin = await prisma.rol.create({
        data: {
          nombre: "ADMINISTRADOR",
          descripcion: "Rol con acceso completo al sistema",
          id_empresa: nuevaEmpresa.id_empresa
        }
      });

      // // 3. Crear permisos predeterminados
      // const permisos = ["VER_USUARIOS", "EDITAR_USUARIOS", "ELIMINAR_USUARIOS"];
      // const permisosCreados = await Promise.all(
      //   permisos.map((permiso) =>
      //     prisma.permiso.create({
      //       data: {
      //         nombre: permiso,
      //         descripcion: `Permiso para ${permiso.toLowerCase().replace("_", " ")}`,
      //         id_empresa: nuevaEmpresa.id_empresa
      //       }
      //     })
      //   )
      // );

      // // 4. Asignar permisos al rol ADMIN
      // await Promise.all(
      //   permisosCreados.map((permiso) =>
      //     prisma.rol_permiso.create({
      //       data: {
      //         id_rol: rolAdmin.id_rol,
      //         id_permiso: permiso.id_permiso
      //       }
      //     })
      //   )
      // );

      // 5. Hashear contraseña
      const hashedPassword = await hash(contrasena, 10);

      // 6. Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre_completo,
          usuario,
          contrasena: hashedPassword, // Asegurar que coincide con el modelo
          id_empresa: nuevaEmpresa.id_empresa,
          id_rol: rolAdmin.id_rol
        }
      });

      return { empresa: nuevaEmpresa, usuario: nuevoUsuario };
    });

    return res.status(201).json({
      success: true,
      message: "Registro completado",
      empresaId: result.empresa.id_empresa,
      usuarioId: result.usuario.id_usuario
    });

  } catch (error: any) {
    console.error("Error en registro:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message
    });
  }
}