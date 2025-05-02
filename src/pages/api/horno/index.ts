import  HornoService  from '@/lib/services/HornoService';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: 'No autorizado' });

    try {

        const id_empresa = session.user.id_empresa; // Obtener la empresa del usuario autenticado

        switch (method) {
            case 'GET': {
                const horno = await HornoService.getAllHornosByEmpresa(id_empresa);
                return res.status(200).json(horno);
            }
            case 'POST': {
                try {
                    const data = req.body;
                    const newHorno = await HornoService.createHorno(data, id_empresa);
                    return res.status(201).json(newHorno);
                  } catch (error: any) {
                    // Detectar error por duplicidad de 'prefijo'
                    if (
                      error.code === 'P2002' &&
                      error.meta?.target?.includes('prefijo')
                    ) {
                      return res.status(409).json({ message: 'El prefijo ya existe' });
                    }
                
                    // Cualquier otro error
                    return res.status(500).json({ message: 'Error al crear el horno' });
                  }
            }
            case 'PUT': {
                const { id_horno } = req.body;
                const data = req.body;
                // console.log('ID HORNO:', id_horno);
                // console.log('DATA:', data);
                if (id_horno) {
                    const updatedHorno = await HornoService.updateHorno(Number(id_horno), id_empresa, data);
                    return res.status(200).json(updatedHorno);
                }
                return res.status(400).json({ message: 'Faltan parámetros' });
            }
            case 'DELETE': {
                const { id_horno } = req.query;
                if (id_horno) {
                    await HornoService.deleteHorno(Number(id_horno), id_empresa);
                    return res.status(204).end();
                }
                return res.status(400).json({ message: 'Faltan parámetros' });
            }
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Método ${method} no permitido`);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}