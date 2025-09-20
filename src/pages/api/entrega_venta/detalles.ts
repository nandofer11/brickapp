import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

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

        if (req.method !== 'GET') {
            res.setHeader('Allow', ['GET']);
            return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }

        // Obtener parámetros de consulta
        const { ventaId, productoId } = req.query;
        
        if (!ventaId || !productoId) {
            return res.status(400).json({ message: 'Se requiere ID de venta y ID de producto' });
        }
        
        const idVenta = parseInt(ventaId as string);
        const idProducto = parseInt(productoId as string);
        
        if (isNaN(idVenta) || isNaN(idProducto)) {
            return res.status(400).json({ message: 'Los IDs deben ser números válidos' });
        }

        // Verificar que la venta pertenezca a la empresa
        const venta = await prisma.venta.findFirst({
            where: {
                id_venta: idVenta,
                id_empresa
            }
        });
        
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        
        // Obtener todos los detalles de entrega para el producto específico en la venta
        const detalles = await prisma.detalle_entrega_venta.findMany({
            where: {
                entrega_venta: {
                    id_venta: idVenta
                },
                id_producto: idProducto
            },
            include: {
                entrega_venta: true,
                producto: {
                    select: {
                        nombre: true
                    }
                }
            }
        });
        
        return res.status(200).json(detalles);
    } catch (error) {
        console.error('Error en API de detalles de entrega:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error });
    }
}
