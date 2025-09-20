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

        switch (req.method) {
            case 'GET':
                // Obtener entregas (por venta)
                const ventaId = req.query.ventaId ? parseInt(req.query.ventaId as string) : undefined;
                
                const entregas = await prisma.entrega_venta.findMany({
                    where: {
                        venta: {
                            id_venta: ventaId,
                            id_empresa: id_empresa
                        }
                    },
                    include: {
                        detalle_entrega_venta: {
                            include: {
                                producto: true
                            }
                        }
                    },
                    orderBy: {
                        fecha: 'desc'
                    }
                });
                
                return res.status(200).json(entregas);
                
            case 'POST':
                // Crear una nueva entrega
                const { id_venta, fecha_entrega, lugar_carga, detalles } = req.body;
                
                if (!id_venta || !fecha_entrega || !lugar_carga || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
                    return res.status(400).json({ message: 'Datos de entrega inválidos' });
                }
                
                // Verificar que la venta exista y pertenezca a la empresa
                const venta = await prisma.venta.findFirst({
                    where: {
                        id_venta,
                        id_empresa
                    },
                    include: {
                        detalle_venta: true
                    }
                });
                
                if (!venta) {
                    return res.status(404).json({ message: 'Venta no encontrada' });
                }
                
                // Validar que la venta no esté anulada
                if (venta.estado_venta === 'ANULADA') {
                    return res.status(400).json({ message: 'No se pueden registrar entregas para ventas anuladas' });
                }
                
                // Validar que todos los productos en detalles existan en la venta
                for (const detalle of detalles) {
                    const { id_producto, cantidad } = detalle;
                    
                    const detalleVenta = venta.detalle_venta.find(d => d.id_producto === id_producto);
                    if (!detalleVenta) {
                        return res.status(400).json({
                            message: `El producto con ID ${id_producto} no está incluido en esta venta`
                        });
                    }
                    
                    // Verificar disponibilidad (cantidad pendiente de entrega)
                    const entregasPrevias = await prisma.detalle_entrega_venta.findMany({
                        where: {
                            entrega_venta: {
                                id_venta
                            },
                            id_producto
                        }
                    });
                    
                    const cantidadEntregada = entregasPrevias.reduce((sum, d) => sum + d.cantidad, 0);
                    const cantidadDisponible = detalleVenta.cantidad - cantidadEntregada;
                    
                    if (cantidad > cantidadDisponible) {
                        return res.status(400).json({
                            message: `No hay suficiente cantidad disponible para el producto con ID ${id_producto}. Disponible: ${cantidadDisponible}, Solicitado: ${cantidad}`
                        });
                    }
                }
                
                // Crear la entrega y sus detalles en una transacción
                const entregaCreada = await prisma.$transaction(async (tx) => {
                    // 1. Crear la entrega
                    const entrega = await tx.entrega_venta.create({
                        data: {
                            venta: { connect: { id_venta } },
                            fecha: new Date(fecha_entrega),
                            lugar_carga
                        }
                    });
                    
                    // 2. Crear los detalles de la entrega
                    for (const detalle of detalles) {
                        await tx.detalle_entrega_venta.create({
                            data: {
                                entrega_venta: { connect: { id_entrega_venta: entrega.id_entrega_venta } },
                                producto: { connect: { id_producto: detalle.id_producto } },
                                cantidad: detalle.cantidad
                            }
                        });
                    }
                    
                    // 3. Actualizar el estado de entrega de la venta según el total entregado
                    // Primero, obtener todos los detalles de entregas para esta venta (incluyendo los nuevos)
                    const todasLasEntregas = await tx.detalle_entrega_venta.findMany({
                        where: {
                            entrega_venta: {
                                id_venta
                            }
                        }
                    });
                    
                    // Calcular cuánto se ha entregado por producto
                    const entregasPorProducto = new Map<number, number>();
                    todasLasEntregas.forEach(e => {
                        const cantidad = entregasPorProducto.get(e.id_producto) || 0;
                        entregasPorProducto.set(e.id_producto, cantidad + e.cantidad);
                    });
                    
                    // Verificar si se ha completado la entrega o es parcial
                    let entregaCompleta = true;
                    for (const detalleVenta of venta.detalle_venta) {
                        const cantidadEntregada = entregasPorProducto.get(detalleVenta.id_producto) || 0;
                        if (cantidadEntregada < detalleVenta.cantidad) {
                            entregaCompleta = false;
                            break;
                        }
                    }
                    
                    // Actualizar estado de la venta según el resultado
                    const nuevoEstadoEntrega = entregaCompleta ? 'ENTREGADO' : 'PARCIAL';
                    await tx.venta.update({
                        where: { id_venta },
                        data: { estado_entrega: nuevoEstadoEntrega }
                    });
                    
                    // 4. Si el estado de pago es CANCELADO y ahora la entrega es ENTREGADO, cambiar estado_venta a CERRADA
                    if (venta.estado_pago === 'CANCELADO' && nuevoEstadoEntrega === 'ENTREGADO') {
                        await tx.venta.update({
                            where: { id_venta },
                            data: { estado_venta: 'CERRADA' }
                        });
                    }
                    
                    // Retornar la entrega con sus detalles
                    return await tx.entrega_venta.findUnique({
                        where: { id_entrega_venta: entrega.id_entrega_venta },
                        include: {
                            detalle_entrega_venta: {
                                include: {
                                    producto: true
                                }
                            }
                        }
                    });
                });
                
                return res.status(201).json(entregaCreada);
                
            default:
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error('Error en API de entrega_venta:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error });
    }
}
