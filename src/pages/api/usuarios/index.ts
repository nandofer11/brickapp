import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authorization.split(" ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET || "default_secret"); // Verificar el token
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }

  switch (req.method) {
    case "GET": {
      const { id_empresa } = req.query;

      if (!id_empresa) {
        return res.status(400).json({ error: "id_empresa es requerido" });
      }

      // Lógica para obtener usuarios
      return res.status(200).json({ message: "Usuarios obtenidos correctamente" });
    }

    case "POST": {
      const { nombre, email, rol, id_empresa } = req.body;

      if (!nombre || !email || !rol || !id_empresa) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      // Lógica para crear un usuario
      return res.status(201).json({ message: "Usuario creado correctamente" });
    }

    case "PUT": {
      const { id, nombre, email, rol } = req.body;

      if (!id || !nombre || !email || !rol) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      // Lógica para actualizar un usuario
      return res.status(200).json({ message: "Usuario actualizado correctamente" });
    }

    case "DELETE": {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "id es requerido" });
      }

      // Lógica para eliminar un usuario
      return res.status(200).json({ message: "Usuario eliminado correctamente" });
    }

    default:
      return res.status(405).json({ error: "Método no permitido" });
  }
}
