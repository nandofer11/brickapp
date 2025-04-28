import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

import PersonalService from "@/lib/services/PersonalService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // await connectDB(); // Asegurar conexión a la BD

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: "No autorizado" });
  
  try {
  
    const id_empresa = session.user.id_empresa; // 🔥 Obtener la empresa del usuario autenticado

    if(req.method === "GET") {
      const personal = await PersonalService.getAllByEmpresa(id_empresa);
      return res.status(200).json(personal);
    }
  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
