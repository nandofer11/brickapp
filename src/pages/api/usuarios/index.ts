import type { NextApiRequest, NextApiResponse } from "next";
import { usuarioService } from "@/lib/services/UsuarioService";
import { validateToken } from "@/lib/utils/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    validateToken(req); // Validar el token

    const id_empresa = parseInt(req.query.id_empresa as string);

    if (!id_empresa) {
      return res.status(400).json({ error: "Falta el parámetro id_empresa" });
    }

    try {
      switch (req.method) {
        case "GET":
          const usuarios = await usuarioService.getAllUsuarios(id_empresa);
          return res.status(200).json(usuarios);

        case "POST":
          const nuevoUsuario = await usuarioService.createUsuario({
            ...req.body,
            id_empresa,
          });
          return res.status(201).json(nuevoUsuario);

        default:
          return res.status(405).json({ error: "Método no permitido" });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Error del servidor" });
    }
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}
