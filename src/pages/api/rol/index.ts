import type { NextApiRequest, NextApiResponse } from "next";
import rolService from "@/lib/services/RolService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // Importar configuración de NextAuth

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Headers:", req.headers); // Depurar encabezados de la solicitud
  console.log("Cookies:", req.cookies); // Depurar cookies de la solicitud

  const session = await getServerSession(req, res, authOptions); // Obtener sesión de NextAuth

  console.log("Session:", session); // Para depuración
  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  try {
    const id_empresa = Number(session.user?.id_empresa); // Obtener id_empresa desde la sesión

    if (req.method === "GET") {
      const roles = await rolService.getAll(id_empresa);
      return res.status(200).json(roles);
    }

    if (req.method === "POST") {
      const rol = await rolService.create({ ...req.body, id_empresa });
      return res.status(201).json(rol);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error("Error:", error); // Depurar errores
    return res.status(500).json({ error: error.message });
  }
}
