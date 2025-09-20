import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
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

        // Obtener el ID de la venta de la URL
        const { id } = req.query;
        const ventaId = parseInt(id as string);

        if (isNaN(ventaId)) {
            return res.status(400).json({ message: 'ID de venta no válido' });
        }

        // Verificar que la venta pertenezca a la empresa del usuario
        const ventaExistente = await prisma.venta.findFirst({
            where: {
                id_venta: ventaId,
                id_empresa
            }
        });

        if (!ventaExistente) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        switch (req.method) {
            case 'GET':
                // Obtener los detalles completos de la venta
                const venta = await prisma.venta.findUnique({
                    where: { id_venta: ventaId },
                    include: {
                        cliente: true,
                        comprobante_venta: true,
                        detalle_venta: {
                            include: {
                                producto: {
                                    select: {
                                        nombre: true
                                    }
                                }
                            }
                        },
                        servicio_venta: true,
                    },
                });

                // Transformar los datos para facilitar su uso en el frontend
                const detallesFormateados = venta?.detalle_venta.map(detalle => ({
                    ...detalle,
                    nombre_producto: detalle.producto?.nombre || `Producto #${detalle.id_producto}`
                }));

                return res.status(200).json({
                    ...venta,
                    detalles: detallesFormateados
                });

            case 'PATCH':
                console.log('Datos recibidos para actualizar venta:', JSON.stringify(req.body, null, 2));
                
                // Usar el servicio de VentaService para actualizar
                const ventaActualizada = await VentaService.updateVenta(ventaId, req.body, id_empresa);
                
                console.log('Venta actualizada exitosamente:', ventaActualizada?.id_venta);
                return res.status(200).json(ventaActualizada);

            case 'DELETE':
                // En lugar de eliminar, cambiamos todos los estados a 'ANULADA'
                const ventaAnulada = await prisma.venta.update({
                    where: { id_venta: ventaId },
                    data: {
                        estado_entrega: 'ANULADA',
                        estado_pago: 'ANULADA',
                        estado_venta: 'ANULADA' as any // Cast para manejar el enum
                    }
                });

                return res.status(200).json({ 
                    message: 'Venta anulada correctamente',
                    venta: ventaAnulada
                });

            default:
                res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error('Error en API de venta:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error });
    }
}
