import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import VentaService from '@/lib/services/VentaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const id_empresa = session.user?.id_empresa;
        if (!id_empresa) {
            return res.status(400).json({ message: 'ID de empresa no válido' });
        }

        switch (req.method) {
            case 'GET':
                // Verificar si se solicitan ventas pendientes de entrega
                if (req.query.pendientes_entrega === 'true') {
                    const ventasPendientes = await VentaService.getVentasPendientesEntrega(id_empresa);
                    return res.status(200).json(ventasPendientes);
                }
                
                // Obtener todas las ventas (comportamiento original)
                const ventas = await VentaService.getVentas(id_empresa);
                return res.status(200).json(ventas);
                
            case 'POST':
                const venta = await VentaService.createVenta({
                    ...req.body,
                    id_empresa
                });
                return res.status(201).json(venta);

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error('Error en API de ventas:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
