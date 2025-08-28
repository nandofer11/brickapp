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
                // Actualizar la venta
                const { 
                    estado_pago, 
                    estado_entrega, 
                    tipo_comprobante, 
                    adelanto, 
                    saldo_pendiente,
                    observaciones 
                } = req.body;

                // Actualizar los datos básicos de la venta
                const ventaActualizada = await prisma.venta.update({
                    where: { id_venta: ventaId },
                    data: {
                        estado_pago,
                        estado_entrega,
                        adelanto: adelanto !== undefined ? parseFloat(adelanto) : undefined,
                        saldo_pendiente: saldo_pendiente !== undefined ? parseFloat(saldo_pendiente) : undefined,
                        observaciones: observaciones || ''
                    },
                });

                // Si hay tipo de comprobante, actualizar o crear comprobante_venta
                if (tipo_comprobante) {
                    const comprobanteExistente = await prisma.comprobante_venta.findFirst({
                        where: { id_venta: ventaId },
                    });

                    if (comprobanteExistente) {
                        if (tipo_comprobante !== 'NINGUNO') {
                            await prisma.comprobante_venta.update({
                                where: { id_comprobante_venta: comprobanteExistente.id_comprobante_venta },
                                data: { tipo_comprobante: tipo_comprobante },
                            });
                        } else {
                            // Si el tipo es NINGUNO, eliminar el comprobante
                            await prisma.comprobante_venta.delete({
                                where: { id_comprobante_venta: comprobanteExistente.id_comprobante_venta },
                            });
                        }
                    } else if (tipo_comprobante !== 'NINGUNO') {
                        // Crear nuevo comprobante si no existe y no es NINGUNO
                        await prisma.comprobante_venta.create({
                            data: {
                                id_venta: ventaId,
                                tipo_comprobante: tipo_comprobante,
                                serie: 'F',
                                numero: ventaId.toString().padStart(6, '0'),
                                fecha_emision: new Date()
                            },
                        });
                    }
                }

                return res.status(200).json(ventaActualizada);

            case 'DELETE':
                // Eliminar la venta y sus relaciones
                // Realizamos la eliminación en una transacción para garantizar la integridad
                await prisma.$transaction([
                    // Eliminar los comprobantes relacionados
                    prisma.comprobante_venta.deleteMany({
                        where: { id_venta: ventaId }
                    }),
                    // Eliminar los servicios relacionados
                    prisma.servicio_venta.deleteMany({
                        where: { id_venta: ventaId }
                    }),
                    // Eliminar los detalles relacionados
                    prisma.detalle_venta.deleteMany({
                        where: { id_venta: ventaId }
                    }),
                    // Finalmente eliminar la venta
                    prisma.venta.delete({
                        where: { id_venta: ventaId }
                    })
                ]);

                return res.status(200).json({ message: 'Venta eliminada correctamente' });

            default:
                res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error('Error en API de venta:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error });
    }
}
