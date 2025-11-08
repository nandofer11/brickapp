import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import NumeracionComprobanteService from "@/lib/services/NumeracionComprobanteService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "No autorizado: sesión no encontrada" });
  }

  const id_empresa = Number(session.user?.id_empresa);

  try {
    switch (req.method) {
      case "GET":
        if (req.query.id) {
          const id = parseInt(req.query.id as string);
          const data = await NumeracionComprobanteService.findById(id);
          return res.status(200).json(data);
        } else {
          console.log(`Obteniendo numeración de comprobantes para empresa ID: ${id_empresa}`);
          const data = await NumeracionComprobanteService.findByEmpresa(id_empresa);
          console.log('Numeración de comprobantes obtenida:', JSON.stringify(data, null, 2));
          return res.status(200).json(data);
        }

      case "POST":
        const created = await NumeracionComprobanteService.create({
          ...req.body,
          id_empresa,
        });
        return res.status(201).json(created);

      case "PUT":
        const idToUpdate = req.query.id 
          ? parseInt(req.query.id as string, 10) 
          : req.body.id_numeracion_comprobante;

        if (!idToUpdate) {
          return res.status(400).json({ message: "ID requerido para actualizar" });
        }

        const updated = await NumeracionComprobanteService.update(idToUpdate, req.body);
        return res.status(200).json(updated);

      case "DELETE":
        const idToDelete = parseInt(req.query.id as string, 10);
        if (!idToDelete) {
          return res.status(400).json({ message: "ID requerido para eliminar" });
        }

        await NumeracionComprobanteService.delete(idToDelete);
        return res.status(204).end();

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido.`);
    }
  } catch (error) {
    console.error("Error en /api/numeracion_comprobante:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
