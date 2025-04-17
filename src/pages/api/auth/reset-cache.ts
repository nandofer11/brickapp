import { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Esta API es solo para desarrollo
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "No disponible en producción" });
  }

  try {
    // Eliminación opcional de archivos de caché de NextAuth
    const nextAuthDir = path.join(process.cwd(), '.next', 'server', 'pages', 'api', 'auth');
    if (fs.existsSync(nextAuthDir)) {
      const files = fs.readdirSync(nextAuthDir);
      
      for (const file of files) {
        if (file.includes('.json')) {
          const filePath = path.join(nextAuthDir, file);
          fs.unlinkSync(filePath);
          console.log(`Eliminado archivo de caché: ${filePath}`);
        }
      }
    }

    // Verificar la configuración
    const configCheck = {
      nextauth_secret: process.env.NEXTAUTH_SECRET || "NO CONFIGURADO",
      nextauth_url: process.env.NEXTAUTH_URL || "NO CONFIGURADO", 
      database_url: process.env.DATABASE_URL ? "CONFIGURADO" : "NO CONFIGURADO"
    };

    return res.status(200).json({
      success: true,
      message: "Caché limpiada con éxito",
      configCheck,
      tips: [
        "Después de ejecutar esta función, reinicia el servidor completamente",
        "Asegúrate de que NEXTAUTH_SECRET esté configurado correctamente en .env",
        "Verifica que la URL de la base de datos sea correcta",
        "Limpia también la caché del navegador o usa una ventana de incógnito"
      ]
    });
  } catch (error) {
    console.error("Error al limpiar caché:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al limpiar caché",
      error: error instanceof Error ? error.message : "Error desconocido" 
    });
  }
} 