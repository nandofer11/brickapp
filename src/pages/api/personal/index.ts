import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

import PersonalService from "@/lib/services/PersonalService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const session = await getServerSession(req, res, authOptions);

  if (!session) return res.status(401).json({ message: "No autorizado" });
  
  try {
  
    const id_empresa = session.user.id_empresa; // 🔥 Obtener la empresa del usuario autenticado

    if (req.method === "POST") {
      const {
        dni,
        nombre_completo,
        fecha_nacimiento,
        ciudad,
        direccion,
        celular,
        pago_diario_normal,
        pago_diario_reducido,
        fecha_ingreso,
        estado,
        id_empresa,
      } = req.body;

      // Validar que los campos requeridos estén presentes
      const requiredFields = [
        { field: dni, name: "DNI" },
        { field: nombre_completo, name: "Nombre completo" },
        { field: fecha_nacimiento, name: "Fecha de nacimiento" },
        { field: ciudad, name: "Ciudad" },
        { field: pago_diario_normal, name: "Pago diario normal" },
        { field: fecha_ingreso, name: "Fecha de ingreso" },
        { field: estado, name: "Estado" },
        { field: id_empresa, name: "ID Empresa" },
      ];

      for (const { field, name } of requiredFields) {
        if (field === undefined || field === null || field.toString().trim() === "") {
          return res.status(400).json({ message: `El campo ${name} es obligatorio.` });
        }
      }

      try {
        // Crear el personal
        const personal = await PersonalService.createPersonal({
          dni,
          nombre_completo,
          fecha_nacimiento,
          ciudad,
          direccion: direccion || null,
          celular: celular || null,
          pago_diario_normal,
          pago_diario_reducido: pago_diario_reducido || null,
          fecha_ingreso,
          estado,
          id_empresa,
        });
        return res.status(201).json(personal);
      } catch (error) {
        console.error("Error al crear el personal:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
      }
    }

    if (req.method === "PUT") {
      const {
        id_personal,
        dni,
        nombre_completo,
        fecha_nacimiento,
        ciudad,
        direccion,
        celular,
        pago_diario_normal,
        pago_diario_reducido,
        fecha_ingreso,
        estado,
        id_empresa,
      } = req.body;

      if (!id_personal) {
        return res.status(400).json({ message: "El ID del personal es obligatorio para actualizar." });
      }

      // Validar que los campos requeridos estén presentes
      const requiredFields = [
        { field: dni, name: "DNI" },
        { field: nombre_completo, name: "Nombre completo" },
        { field: fecha_nacimiento, name: "Fecha de nacimiento" },
        { field: ciudad, name: "Ciudad" },
        { field: pago_diario_normal, name: "Pago diario normal" },
        { field: fecha_ingreso, name: "Fecha de ingreso" },
        { field: estado, name: "Estado" },
        { field: id_empresa, name: "ID Empresa" },
      ];

      for (const { field, name } of requiredFields) {
        if (field === undefined || field === null || field.toString().trim() === "") {
          return res.status(400).json({ message: `El campo ${name} es obligatorio.` });
        }
      }

      // Actualizar el personal
      const updatedPersonal = await PersonalService.updatePersonal(id_personal, id_empresa, {
        dni,
        nombre_completo,
        fecha_nacimiento,
        ciudad,
        direccion: direccion || null,
        celular: celular || null,
        pago_diario_normal,
        pago_diario_reducido: pago_diario_reducido || null,
        fecha_ingreso,
        estado,
        id_empresa,
      });
      return res.status(200).json(updatedPersonal);
    }

    if(req.method === "GET") {
      const personal = await PersonalService.getAllByEmpresa(id_empresa);
      return res.status(200).json(personal);
    }

    if (req.method === "DELETE") {
      const { id_personal } = req.query;

      if (!id_personal) {
        return res.status(400).json({ message: "El ID del personal es obligatorio para eliminar." });
      }

      // Eliminar el personal
      await PersonalService.deletePersonal(Number(id_personal), id_empresa);
      return res.status(204).end(); // No content
    }

  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
