import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";

const prisma = new PrismaClient();

const MODELOS_VALIDOS = ["empresa", "personal", "cliente"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  const id_empresa = Number(session.user?.id_empresa);

  try {
    const { tipo, numero } = req.body;

    if (!tipo || !numero) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    if (!MODELOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ message: "Tipo de modelo no válido." });
    }

    // Validar formato: RUC debe tener 11 dígitos
    const isRUC = numero.length === 11;
    const isDNI = numero.length === 8;

    if (!isRUC && !isDNI) {
      return res.status(400).json({
        message: "Número debe ser un RUC (11 dígitos) o DNI (8 dígitos).",
      });
    }

    const modelDelegate = prisma[tipo as keyof typeof prisma] as any;

    // Verificar si ya existe en la tabla correspondiente y empresa
    let record = null;

    if (tipo === "empresa") {
      // Para empresas no filtramos por id_empresa
      record = await modelDelegate.findFirst({
        where: isRUC ? { ruc: numero } : {},
      });
    } else {
      record = await modelDelegate.findFirst({
        where: {
          ...(isRUC ? { ruc: numero } : { dni: numero }),
          id_empresa,
        },
      });
    }

    if (record) {
      return res.status(400).json({
        message: `${isRUC ? "RUC" : "DNI"} ya está registrado en esta empresa.`,
      });
    }

    if (isRUC) {
      console.log(`Consultando RUC: ${numero}, Token: ${process.env.SUNAT_API_TOKEN?.substring(0, 10)}...`);
      
      const url = `https://api.decolecta.com/v1/sunat/ruc?numero=${numero}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.SUNAT_API_TOKEN || ""}`,
          },
        });

        if (!response.ok) {
          console.error(`Error API SUNAT: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Respuesta de error: ${errorText}`);
          return res.status(400).json({ message: `Error al consultar RUC en SUNAT: ${response.status} ${response.statusText}` });
        }

        const data = await response.json();
        console.log("Respuesta SUNAT:", JSON.stringify(data).substring(0, 200));

        // Verificar si la respuesta tiene los campos esperados (según el formato que enviaste)
        if (!data.razon_social && data.razon_social !== "") {
          return res.status(400).json({ message: "RUC no válido o sin datos de razón social." });
        }

        // Formatear respuesta con los campos que espera tu aplicación
        return res.status(200).json({
          razon_social: data.razon_social,
          direccion: data.direccion || "-"
        });
      } catch (error) {
        console.error("Error en la solicitud a SUNAT:", error);
        return res.status(500).json({ message: "Error al comunicarse con el servicio de SUNAT" });
      }
    }

    if (isDNI) {
      const url = `https://api.decolecta.com/v1/reniec/dni?numero=${numero}`;
      
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.RENIEC_API_TOKEN || ""}`,
          },
        });

        if (!response.ok) {
          console.error(`Error API RENIEC: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Respuesta de error: ${errorText}`);
          return res.status(400).json({ message: `Error al consultar DNI en RENIEC: ${response.status} ${response.statusText}` });
        }

        const data = await response.json();
        console.log("Respuesta RENIEC:", JSON.stringify(data).substring(0, 200));
        
        // Adaptar al formato real de la respuesta
        if (!data.first_name && !data.first_last_name && !data.second_last_name) {
          return res.status(400).json({ message: "DNI no válido o sin datos." });
        }

        return res.status(200).json({
          nombres: data.first_name,
          apellido_paterno: data.first_last_name,
          apellido_materno: data.second_last_name,
          nombre_completo: data.full_name
        });
      } catch (error) {
        console.error("Error en la solicitud a RENIEC:", error);
        return res.status(500).json({ message: "Error al comunicarse con el servicio de RENIEC" });
      }
    }

    return res.status(200).json({ message: "Documento válido." });

  } catch (error) {
    console.error("Error en validación de identidad:", error);
    return res.status(500).json({ message: "Error del servidor" });
  } finally {
    await prisma.$disconnect();
  }
}