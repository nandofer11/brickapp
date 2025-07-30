import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
    }

    const sessionEmpresaId = Number(session.user?.id_empresa);
    
    // Obtener el ID de la empresa desde la ruta
    const { id } = req.query;
    const empresaId = Number(id);

    // Verificar que el usuario pertenece a esta empresa
    if (sessionEmpresaId !== empresaId) {
      return res.status(403).json({ message: "No autorizado: No puede acceder a los datos de otra empresa" });
    }

    switch (req.method) {
      case "GET":
        // Obtener datos de la empresa
        const empresa = await prisma.empresa.findUnique({
          where: { id_empresa: empresaId }
        });

        if (!empresa) {
          return res.status(404).json({ message: "Empresa no encontrada" });
        }

        return res.status(200).json(empresa);

      case "PUT":
        // Actualizar datos de la empresa - solo campos permitidos
        const { ciudad, telefono, email, web, logo } = req.body;

        // Verificar que no se intenten modificar campos no permitidos
        // (razon_social, ruc, direccion no se pueden modificar)
        const update: any = {
          ...(ciudad !== undefined && { ciudad }),
          ...(telefono !== undefined && { telefono }),
          ...(email !== undefined && { email }),
          ...(web !== undefined && { web })
        };

        // Procesar la imagen si se envió una nueva
        if (logo && logo.startsWith('data:image/')) {
          try {
            // Extraer información de la imagen en base64
            const matches = logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
              const imageType = matches[1];
              const base64Data = matches[2];
              const extension = imageType.split('/')[1];
              
              // Crear directorio si no existe
              const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
              fs.mkdirSync(uploadDir, { recursive: true });
              
              // Generar nombre de archivo único
              const fileName = `logo_${empresaId}_${Date.now()}.${extension}`;
              const filePath = path.join(uploadDir, fileName);
              
              // Guardar la imagen
              fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
              
              // Actualizar el path del logo en la base de datos
              update.logo = `/uploads/logos/${fileName}`;
            } else {
              console.error("Formato de imagen inválido");
            }
          } catch (error) {
            console.error("Error procesando la imagen:", error);
          }
        }

        const updatedEmpresa = await prisma.empresa.update({
          where: { id_empresa: empresaId },
          data: update
        });

        return res.status(200).json(updatedEmpresa);

      default:
        res.setHeader("Allow", ["GET", "PUT"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error(`Error en /api/empresas/[id]:`, error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
