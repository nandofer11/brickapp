import type { NextApiRequest, NextApiResponse } from "next";
import rolService from "@/lib/services/RolService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  try {
    const id_empresa = Number(session.user?.id_empresa);

    if (req.method === "POST") {
      const { nombre, descripcion } = req.body;

      // Validar que los campos requeridos estén presentes
      if (!nombre || !descripcion) {
        return res.status(400).json({ message: "Nombre y descripción son obligatorios" });
      }

      // Crear el rol
      const rol = await rolService.create({ nombre, descripcion, id_empresa });
      return res.status(201).json(rol);
    }

    if (req.method === "GET") {
      const roles = await rolService.getAll(id_empresa);
      return res.status(200).json(roles);
    }

    if (req.method === "PUT") {
      const { id_rol, nombre, descripcion } = req.body;

      // Validar que los campos requeridos estén presentes
      if (!id_rol || !nombre || !descripcion) {
        return res.status(400).json({ message: "ID, nombre y descripción son obligatorios" });
      }

      // Validar que el ID de la empresa coincida
      if (!id_empresa) {
        return res.status(400).json({ message: "ID de empresa es obligatorio" });
      }

      // Actualizar el rol
      const updatedRol = await rolService.update(id_rol, id_empresa, { nombre, descripcion });
      return res.status(200).json(updatedRol);
    }

    if (req.method === "DELETE") {
      console.log("Query params:", req.query); // Depuración para verificar los parámetros de consulta

      const id = req.query.id; // Asegúrate de obtener el parámetro `id` correctamente
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "ID de rol inválido" });
      }

      const id_rol = Number(id);
      const id_empresa = Number(session.user?.id_empresa);

      try {
        // Verificar que el rol pertenece a la empresa del usuario
        const rol = await rolService.getById(id_rol, id_empresa);
        if (!rol) {
          return res.status(404).json({ message: "Rol no encontrado" });
        }

        // Eliminar el rol
        await rolService.delete(id_rol, id_empresa);
        return res.status(200).json({ message: "Rol eliminado correctamente" });
      } catch (error: any) {
        console.error("Error al eliminar rol:", error);
        return res.status(500).json({ message: "Error al eliminar rol" });
      }
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}