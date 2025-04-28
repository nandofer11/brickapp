import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { usuarioService } from "@/lib/services/UsuarioService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const id_empresa = session.user?.id_empresa; // Obtener id_empresa desde la sesión

  if (!id_empresa) {
    return res.status(400).json({ error: "id_empresa no disponible en la sesión" });
  }

  switch (req.method) {
    case "GET": {
      const { id } = req.query;

      try {
        if (id) {
          const usuario = await usuarioService.getUsuarioById(Number(id), id_empresa);
          return res.status(200).json(usuario);
        } else {
          const usuarios = await usuarioService.getAllUsuarios(id_empresa);
          return res.status(200).json(usuarios);
        }
      } catch (error) {
        return res.status(500).json({ error: "Error al obtener usuarios" });
      }
    }

    case "POST": {
      const { nombre, email, rol } = req.body;

      if (!nombre || !email || !rol) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      try {
        const nuevoUsuario = await usuarioService.createUsuario({ nombre, email, rol, id_empresa });
        return res.status(201).json(nuevoUsuario);
      } catch (error) {
        return res.status(500).json({ error: "Error al crear usuario" });
      }
    }

    case "PUT": {
      const { id, nombre, email, rol } = req.body;

      if (!id || !nombre || !email || !rol) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      try {
        const usuarioActualizado = await usuarioService.updateUsuario(Number(id), id_empresa, { nombre, email, rol });
        return res.status(200).json(usuarioActualizado);
      } catch (error) {
        return res.status(500).json({ error: "Error al actualizar usuario" });
      }
    }

    case "DELETE": {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "id es requerido" });
      }

      try {
        await usuarioService.deleteUsuario(Number(id), id_empresa);
        return res.status(200).json({ message: "Usuario eliminado correctamente" });
      } catch (error) {
        return res.status(500).json({ error: "Error al eliminar usuario" });
      }
    }

    default:
      return res.status(405).json({ error: "Método no permitido" });
  }
}
