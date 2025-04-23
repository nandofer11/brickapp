import type { NextApiRequest, NextApiResponse } from "next";
import { usuarioService } from "@/lib/services/UsuarioService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id_usuario = parseInt(req.query.id as string);
  const id_empresa = parseInt(req.query.id_empresa as string);

  if (!id_empresa || !id_usuario) {
    return res.status(400).json({ error: "Faltan parámetros id_usuario o id_empresa" });
  }

  try {
    switch (req.method) {
      case "GET":
        const usuario = await usuarioService.getUsuarioById(id_usuario, id_empresa);
        return res.status(200).json(usuario);

      case "PUT":
        const usuarioActualizado = await usuarioService.updateUsuario(
          id_usuario,
          id_empresa,
          req.body
        );
        return res.status(200).json(usuarioActualizado);

      case "DELETE":
        const eliminado = await usuarioService.deleteUsuario(id_usuario, id_empresa);
        return res.status(200).json({ success: eliminado });

      default:
        return res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Error del servidor" });
  }
}
