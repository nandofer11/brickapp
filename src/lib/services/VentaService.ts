import { prisma } from '@/lib/prisma';

export class VentaService {
    async createVenta(data: any) {
        const { 
            cliente_id, 
            comprobante, 
            productos, 
            servicios,
            total,
            id_empresa 
        } = data;

        return await prisma.$transaction(async (tx) => {
            // Crear comprobante
            const comprobanteVenta = await tx.comprobante_venta.create({
                data: {
                    ...comprobante,
                    id_empresa
                }
            });

            // Crear venta
            const venta = await tx.venta.create({
                data: {
                    cliente_id,
                    comprobante_id: comprobanteVenta.id_comprobante,
                    total,
                    estado: 'PENDIENTE',
                    id_empresa,
                    detalle_venta: {
                        create: productos.map((p: any) => ({
                            producto_id: p.id_producto,
                            cantidad: p.cantidad,
                            precio_unitario: p.precio_unitario,
                            subtotal: p.subtotal
                        }))
                    },
                    servicio_venta: servicios && servicios.length > 0 ? {
                        create: servicios.map((s: any) => ({
                            descripcion: s.descripcion,
                            monto: s.monto
                        }))
                    } : undefined
                },
                include: {
                    detalle_venta: true,
                    servicio_venta: true,
                    comprobante: true
                }
            });

            return venta;
        });
    }
}

export default new VentaService();
