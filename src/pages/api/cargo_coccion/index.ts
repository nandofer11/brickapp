import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import CargoCoccionService from '@/lib/services/CargoCoccionService';
import { prisma } from "@/lib/prisma";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    const { method } = req;
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: 'No autorizado' });

    try {
        const id_empresa = session.user.id_empresa; // Obtener la empresa del usuario autenticado

        switch (method) {
            case 'GET': {
                const cargos = await CargoCoccionService.findAllByEmpresa(id_empresa);
                return res.status(200).json(cargos);
            }
            case "POST": {
                // Crear un nuevo cargo de cocción
                const data = req.body;
                const newCargo = await CargoCoccionService.createCargoCoccion(data);
                return res.status(201).json(newCargo);
            }
            case "PUT": {
                // Actualizar un cargo de cocción existente
                const { id_cargo_coccion } = req.body;
                if (id_cargo_coccion) {
                    const updatedCargo = await CargoCoccionService.updateCargoCoccion(
                        Number(id_cargo_coccion),
                        req.body.nombre_cargo,
                        req.body.costo_cargo,
                        req.body.id_horno
                    );
                    return res.status(200).json(updatedCargo);
                }
                return res.status(400).json({ message: "Faltan parámetros" });
            }
            case "DELETE": {
                // Eliminar un cargo de cocción por ID
                const { id_cargo_coccion } = req.query;
                if (id_cargo_coccion) {
                    await CargoCoccionService.delete(Number(id_cargo_coccion), id_empresa);
                    return res.status(204).end();
                }
                return res.status(400).json({ message: "Faltan parámetros" });
            }
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
