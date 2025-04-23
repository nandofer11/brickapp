// import { NextApiRequest, NextApiResponse } from "next";
// import { connectDB } from "@/config/database";
// import { Asistencia } from "@/models/Asistencia";
// import { SemanaTrabajo } from "@/models/SemanaTrabajo";
// import { Personal } from "@/models/Personal";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   await connectDB();

//   try {
//     const session = await getServerSession(req, res, authOptions);
//     if (!session) {
//       return res.status(401).json({ message: "No autorizado" });
//     }

//     const id_empresa = session.user.id_empresa; // Obtenemos el ID de la empresa del usuario autenticado.

//     switch (req.method) {
//       case "GET": {
//         const { fecha, id_semana_trabajo } = req.query;

//         // Filtros para las asistencias
//         const whereFilter: any = { "$SemanaTrabajo.id_empresa$": id_empresa }; // Filtrar por la empresa del usuario
//         if (fecha) whereFilter.fecha = fecha; // Filtrar por fecha, si se proporciona
//         if (id_semana_trabajo) whereFilter.id_semana_trabajo = id_semana_trabajo; // Filtrar por semana de trabajo, si se proporciona

//         // Consultar las asistencias con relaciones
//         const asistencias = await Asistencia.findAll({
//           where: whereFilter,
//           include: [
//             { model: Personal, as: "Personal" },
//             { model: SemanaTrabajo, as: "SemanaTrabajo" },
//           ],
//         });

//         return res.status(200).json(asistencias);
//       }

//       case "POST": {
//         const nuevaAsistenciaData = req.body;

//         if (!Array.isArray(nuevaAsistenciaData) || nuevaAsistenciaData.length === 0) {
//           return res.status(400).json({ message: "Debe enviar una lista de asistencias." });
//         }

//         // Extraer los IDs de semanas de trabajo de las asistencias
//         const semanasTrabajoIds = [...new Set(nuevaAsistenciaData.map((a) => a.id_semana_trabajo))];

//         // Verificar que las semanas de trabajo pertenezcan a la empresa
//         const semanasValidas = await SemanaTrabajo.findAll({
//           where: { id_semana_trabajo: semanasTrabajoIds, id_empresa },
//         });

//         if (semanasTrabajoIds.length !== semanasValidas.length) {
//           return res.status(400).json({
//             message: "Algunas asistencias están asociadas a semanas laborales que no pertenecen a esta empresa.",
//           });
//         }

//         // Crear las nuevas asistencias
//         const nuevasAsistencias = await Asistencia.bulkCreate(nuevaAsistenciaData);
//         return res.status(201).json(nuevasAsistencias);
//       }

//       case "PUT": {
//         if (!Array.isArray(req.body)) {
//           return res.status(400).json({ message: "Se espera un array de asistencias." });
//         }

//         const actualizaciones = await Promise.all(
//           req.body.map(async (asistencia) => {
//             const { id_asistencia, ...datos } = asistencia;

//             // Verificar si la asistencia pertenece a la empresa
//             const asistenciaExistente = await Asistencia.findOne({
//               where: {
//                 id_asistencia,
//                 "$SemanaTrabajo.id_empresa$": id_empresa,
//               },
//               include: { model: SemanaTrabajo, as: "SemanaTrabajo" },
//             });

//             if (!asistenciaExistente) {
//               return { id: id_asistencia, success: false, message: "Asistencia no encontrada o no autorizada." };
//             }

//             await asistenciaExistente.update(datos);
//             return { id: id_asistencia, success: true };
//           })
//         );

//         return res.status(200).json({
//           message: "Asistencias actualizadas correctamente.",
//           resultados: actualizaciones,
//         });
//       }

//       case "DELETE": {
//         const { id_asistencia } = req.body;

//         if (!id_asistencia) {
//           return res.status(400).json({ message: "El ID de asistencia es obligatorio." });
//         }

//         // Verificar que la asistencia pertenezca a la empresa
//         const asistencia = await Asistencia.findOne({
//           where: {
//             id_asistencia,
//             "$SemanaTrabajo.id_empresa$": id_empresa,
//           },
//           include: { model: SemanaTrabajo, as: "SemanaTrabajo" },
//         });

//         if (!asistencia) {
//           return res.status(404).json({ message: "Asistencia no encontrada o no autorizada." });
//         }

//         await asistencia.destroy();
//         return res.status(200).json({ message: "Asistencia eliminada correctamente." });
//       }

//       default:
//         return res.status(405).json({ message: "Método no permitido." });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Error interno del servidor." });
//   }
// }
