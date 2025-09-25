import type { NextApiRequest, NextApiResponse } from "next";
import rolService from "@/lib/services/RolService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  const { id } = req.query;
  const id_rol = Number(id);
  const id_empresa = Number(session.user?.id_empresa);

  if (req.method === "DELETE") {
    if (!id_rol || isNaN(id_rol)) {
      return res.status(400).json({ message: "ID de rol inválido" });
    }

    try {
      const deleted = await rolService.delete(id_rol, id_empresa);
      if (!deleted) {
        return res.status(404).json({ message: "Rol no encontrado o no autorizado" });
      }

      return res.status(200).json({ message: "Rol eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      return res.status(500).json({ message: "Error al eliminar el rol" });
    }
  }

  res.setHeader("Allow", ["DELETE"]);
  return res.status(405).end(`Método ${req.method} no permitido`);
}