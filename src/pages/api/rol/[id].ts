import type { NextApiRequest, NextApiResponse } from "next";
import rolService from "@/lib/services/RolService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id_empresa = Number(req.headers["id-empresa"]);
  const id_rol = Number(req.query.id);

  try {
    if (req.method === "GET") {
      const rol = await rolService.getById(id_rol, id_empresa);
      return res.status(200).json(rol);
    }

    if (req.method === "PUT") {
      const updated = await rolService.update(id_rol, id_empresa, req.body);
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      await rolService.delete(id_rol, id_empresa);
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
