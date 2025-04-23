import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectDB } from "@/config/database";
import { Personal } from "@/models/Personal";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB(); // Asegurar conexión a la BD

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: "No autorizado" });

    const id_empresa = session.user.id_empresa; // 🔥 Obtener la empresa del usuario autenticado

    switch (req.method) {
      case "GET":
        // ✅ Obtener solo los registros de personal de la empresa del usuario autenticado
        const personal = await Personal.findAll({ where: { id_empresa } });
        return res.status(200).json(personal);

      case "POST":
        // ✅ Crear un nuevo registro, asegurando que solo se cree en la empresa del usuario autenticado
        const {
          dni, nombre_completo, fecha_nacimiento, ciudad, direccion, celular,
          pago_diario_normal, pago_diario_reducido, fecha_ingreso, estado
        } = req.body;

        if (!dni || !nombre_completo || !fecha_nacimiento || !ciudad || !pago_diario_normal || !fecha_ingreso || estado === undefined || estado === null) {
          return res.status(400).json({ message: "Faltan datos obligatorios." });
        }

        const personalExistente = await Personal.findOne({ where: { dni } });
        if (personalExistente) {
          return res.status(400).json({ message: "El DNI ya está registrado." });
        }

        const nuevoPersonal = await Personal.create({
          dni, nombre_completo, fecha_nacimiento, ciudad, direccion, celular,
          pago_diario_normal, pago_diario_reducido, fecha_ingreso, estado, id_empresa
        });

        return res.status(201).json(nuevoPersonal);

      case "PUT":
        // ✅ Asegurar que solo se pueda actualizar personal dentro de la empresa del usuario autenticado
        const { id_personal, ...datosActualizar } = req.body;
        if (!id_personal) {
          return res.status(400).json({ message: "El ID del personal es obligatorio para actualizar." });
        }

        const personalActualizar = await Personal.findOne({ where: { id_personal, id_empresa } });
        if (!personalActualizar) {
          return res.status(404).json({ message: "Personal no encontrado o no autorizado." });
        }

        await personalActualizar.update(datosActualizar);
        return res.status(200).json(personalActualizar);

      case "DELETE":
        const idEliminar = Number(req.query.id_personal); // Convertir a número
        if (!idEliminar || isNaN(idEliminar)) {
          return res.status(400).json({ message: "El ID del personal es obligatorio y debe ser válido." });
        }
      
        const personalEliminar = await Personal.findOne({ where: { id_personal: idEliminar, id_empresa } });
        if (!personalEliminar) {
          return res.status(404).json({ message: "Personal no encontrado o no autorizado." });
        }
      
        await personalEliminar.destroy();
        return res.status(200).json({ message: "Personal eliminado correctamente." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}
