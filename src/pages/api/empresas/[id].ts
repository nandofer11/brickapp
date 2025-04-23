// import type { NextApiRequest, NextApiResponse } from "next";
// import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../auth/[...nextauth]";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   // Verificar autenticación
//   const session = await getServerSession(req, res, authOptions);
  
//   if (!session) {
//     return res.status(401).json({ message: "No autorizado" });
//   }

//   // Obtener ID de la empresa
//   const { id } = req.query;
  
//   if (!id || Array.isArray(id)) {
//     return res.status(400).json({ message: "ID de empresa inválido" });
//   }
  
//   // Convertir a número para usar con Prisma
//   const id_empresa = parseInt(id, 10);
  
//   if (isNaN(id_empresa)) {
//     return res.status(400).json({ message: "ID debe ser un número válido" });
//   }
//   // Verificar permisos: solo administradores o usuarios de la misma empresa
//   const userEmpresaId = session.user?.id_empresa ? parseInt(session.user.id_empresa) : null;
//   const esAdministrador = session.user?.rol === "Administrador";
  
//   if (!esAdministrador && userEmpresaId !== id_empresa) {
//     return res.status(403).json({
//       message: "No tienes permisos para acceder a información de esta empresa" 
//     });
//   }
  
//   try {
//     // Comprobar que la empresa existe
//     const empresa = await prisma.empresa.findUnique({
//       where: { id_empresa }
//     });
    
//     if (!empresa) {
//       return res.status(404).json({ message: "Empresa no encontrada" });
//     }
    
//     switch (req.method) {
//       case "GET":
//         return res.status(200).json(empresa);
        
//       case "PUT":
//         // Solo administradores pueden modificar empresas
//         if (!esAdministrador) {
//           return res.status(403).json({ 
//             message: "No tienes permisos para modificar la información de la empresa" 
//           });
//         }
        
//         const { razon_social, direccion, telefono, email, web } = req.body;
        
//         // Validación de datos
//         if (!razon_social) {
//           return res.status(400).json({ 
//             message: "La razón social es obligatoria" 
//           });
//         }
        
//         // Actualizar empresa
//         const empresaActualizada = await prisma.empresa.update({
//           where: { id_empresa },
//           data: {
//             razon_social,
//             direccion: direccion || empresa.direccion,
//             telefono: telefono || empresa.telefono,
//             email: email || empresa.email,
//             web: web || empresa.web
//           }
//         });
        
//         return res.status(200).json(empresaActualizada);
        
//       case "DELETE":
//         // Solo super administradores pueden eliminar empresas (implementar lógica adicional si es necesario)
//         if (!esAdministrador) {
//           return res.status(403).json({ 
//             message: "No tienes permisos para eliminar empresas" 
//           });
//         }
        
//         // Eliminar empresa
//         await prisma.empresa.delete({
//           where: { id_empresa }
//         });
        
//         return res.status(200).json({ message: "Empresa eliminada correctamente" });
        
//       default:
//         res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
//         return res.status(405).json({ message: `Método ${req.method} no permitido` });
//     }
//   } catch (error: any) {
//     console.error(`Error en operación ${req.method} para empresa ${id}:`, error);
    
//     if (error.code === 'P2025') {
//       return res.status(404).json({ message: "Empresa no encontrada" });
//     }
    
//     if (error.code === 'P2002') {
//       return res.status(400).json({ message: "Ya existe una empresa con ese RUC" });
//     }
    
//     return res.status(500).json({ 
//       message: "Error interno del servidor", 
//       error: error.message 
//     });
//   }
// } 