import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { ruc } = req.body;

    // ✅ Validar que el RUC tenga 11 dígitos
    if (!ruc || ruc.length !== 11) {
      return res.status(400).json({ message: "El RUC debe tener 11 dígitos." });
    }

    // ✅ Verificar si el RUC ya está registrado en la BD
    const empresaExistente = await prisma.empresa.findFirst({
      where: { ruc }
    });
    
    if (empresaExistente) {
      return res.status(400).json({ message: "El RUC ya está registrado en la base de datos." });
    }

    // ✅ Configurar la URL y los headers con el token
    const url = `https://api.apis.net.pe/v2/sunat/ruc/full?numero=${ruc}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.SUNAT_API_TOKEN}`,  // Agregar token
        "Content-Type": "application/json"
      }
    });

    // ❗ Capturar posibles errores de la API externa
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("Error en la API externa:", errorMessage);
      return res.status(400).json({ message: "No se pudo validar el RUC con SUNAT." });
    }

    const data = await response.json();
    console.log("Respuesta de la API externa:", data); // ✅ Depuración

    // ✅ Validar que la API externa devolvió datos correctos
    if (!data.razonSocial || !data.direccion) {
      return res.status(400).json({ message: "RUC no válido o sin información." });
    }

    return res.status(200).json({ razon_social: data.razonSocial, direccion: data.direccion });

  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  } finally {
    await prisma.$disconnect();
  }
}
