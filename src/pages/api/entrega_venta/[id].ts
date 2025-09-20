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

        const { id } = req.query;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'ID de entrega no válido' });
        }
        
        const entregaId = parseInt(id);

        // Verificar que la entrega pertenezca a la empresa del usuario autenticado
        const entrega = await prisma.entrega_venta.findFirst({
            where: {
                id_entrega_venta: entregaId,
                venta: {
                    id_empresa: id_empresa
                }
            }
        });

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega no encontrada' });
        }

        switch (req.method) {
            case 'PUT':
                // Actualizar una entrega existente
                const { fecha_entrega, lugar_carga, detalles } = req.body;
                
                if (!fecha_entrega || !lugar_carga || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
                    return res.status(400).json({ message: 'Datos de entrega inválidos' });
                }

                // Actualizar en una transacción
                const entregaActualizada = await prisma.$transaction(async (prisma) => {
                    // 1. Actualizar la entrega principal
                    const entregaActualizada = await prisma.entrega_venta.update({
                        where: {
                            id_entrega_venta: entregaId
                        },
                        data: {
                            fecha: new Date(fecha_entrega),
                            lugar_carga: lugar_carga
                        }
                    });
                    
                    // 2. Eliminar los detalles existentes
                    await prisma.detalle_entrega_venta.deleteMany({
                        where: {
                            id_entrega_venta: entregaId
                        }
                    });
                    
                    // 3. Crear los nuevos detalles
                    for (const detalle of detalles) {
                        await prisma.detalle_entrega_venta.create({
                            data: {
                                id_entrega_venta: entregaId,
                                id_producto: detalle.id_producto,
                                cantidad: detalle.cantidad
                            }
                        });
                    }
                    
                    return entregaActualizada;
                });
                
                return res.status(200).json(entregaActualizada);
                
            case 'DELETE':
                // Eliminar la entrega y sus detalles (usando cascade)
                await prisma.entrega_venta.delete({
                    where: {
                        id_entrega_venta: entregaId
                    }
                });
                
                return res.status(200).json({ message: 'Entrega eliminada correctamente' });
                
            default:
                return res.status(405).json({ message: 'Método no permitido' });
        }
    } catch (error) {
        console.error('Error en API de entrega_venta:', error);
        return res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
}
