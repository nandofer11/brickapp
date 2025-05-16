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
      const url = `https://api.apis.net.pe/v2/sunat/ruc/full?numero=${numero}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.SUNAT_API_TOKEN || ""}`,
        },
      });

      if (!response.ok) {
        return res.status(400).json({ message: "Error al consultar RUC en SUNAT." });
      }

      const data = await response.json();

      if (!data.razonSocial || !data.direccion) {
        return res.status(400).json({ message: "RUC no válido o sin datos." });
      }

      return res.status(200).json({
        razon_social: data.razonSocial,
        direccion: data.direccion,
      });
    }

    if (isDNI) {
      const url = `https://api.apis.net.pe/v1/dni?numero=${numero}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.RENIEC_API_TOKEN || ""}`,
        },
      });

      if (!response.ok) {
        return res.status(400).json({ message: "Error al consultar DNI en RENIEC." });
      }

      const data = await response.json();

      if (!data.nombres || !data.apellidoPaterno || !data.apellidoMaterno) {
        return res.status(400).json({ message: "DNI no válido o sin datos." });
      }

      return res.status(200).json({
        nombres: data.nombres,
        apellido_paterno: data.apellidoPaterno,
        apellido_materno: data.apellidoMaterno,
      });
    }

    return res.status(200).json({ message: "Documento válido." });

  } catch (error) {
    console.error("Error en validación de identidad:", error);
    return res.status(500).json({ message: "Error del servidor" });
  } finally {
    await prisma.$disconnect();
  }
}
