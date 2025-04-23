import type { NextApiRequest, NextApiResponse } from "next";
import rolService from "@/lib/services/RolService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id_empresa = Number(req.headers["id_empresa"]); // puedes ajustar de dónde tomas el id_empresa

  try {
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
    return res.status(500).json({ error: error.message });
  }
}
