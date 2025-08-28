import { prisma } from '@/lib/prisma';

export class VentaService {
    async createVenta(data: any) {
        const { 
            cliente_id, 
            comprobante, 
            productos, 
            servicios,
            total,
            id_empresa,
            estado_pago,
            tipo_venta,
            estado_entrega,
            adelanto,
            saldo_pendiente,
            observaciones
        } = data;

        try {
            // Crear una venta en una única transacción
            return await prisma.$transaction(async (tx) => {
                // 1. Crear la venta primero
                const venta = await tx.venta.create({
                    data: {
                        cliente: { connect: { id_cliente: cliente_id } },
                        total,
                        estado_pago: estado_pago || 'PENDIENTE',
                        fecha_venta: comprobante?.fecha || new Date(),
                        forma_pago: comprobante?.forma_pago || 'EFECTIVO',
                        estado_entrega: estado_entrega || 'PENDIENTE',
                        empresa: { connect: { id_empresa } },
                        usuario: { connect: { id_usuario: comprobante?.id_usuario || 1 } },
                        tipo_venta: tipo_venta || 'NORMAL',
                        adelanto: adelanto || 0,
                        saldo_pendiente: saldo_pendiente || 0,
                        observaciones: observaciones || ''
                    }
                });

                // 2. Crear el comprobante con una referencia a la venta
                const comprobanteCreado = await tx.comprobante_venta.create({
                    data: {
                        tipo_comprobante: comprobante.tipo_comprobante,
                        serie: comprobante.serie,
                        numero: comprobante.numero,
                        venta: { connect: { id_venta: venta.id_venta } }
                    }
                });

                // 4. Crear los detalles de productos
                if (productos && productos.length > 0) {
                    await Promise.all(productos.map(async (p: any) => {
                        await tx.detalle_venta.create({
                            data: {
                                venta: { connect: { id_venta: venta.id_venta } },
                                producto: { connect: { id_producto: p.id_producto } },
                                cantidad: p.cantidad,
                                precio_unitario: p.precio_unitario
                                // No incluimos subtotal ya que parece ser una columna generada automáticamente
                            }
                        });
                    }));
                }

                // 5. Crear los servicios
                if (servicios && servicios.length > 0) {
                    // Agrupar servicios por tipo (flete y descarga)
                    let requiere_flete = 0;
                    let requiere_descarga = 0;
                    let direccion_entrega = null;
                    let costo_flete = 0;
                    let costo_descarga = 0;
                    
                    // Procesar cada servicio para obtener los valores finales
                    servicios.forEach((s: any) => {
                        if (s.tipo === 'flete') {
                            requiere_flete = 1;
                            direccion_entrega = s.direccion_entrega || '';
                            costo_flete = s.monto || 0;
                        } else if (s.tipo === 'descarga') {
                            requiere_descarga = 1;
                            costo_descarga = s.monto || 0;
                        }
                    });
                    
                    // Crear un único registro de servicio_venta con los valores consolidados
                    await tx.servicio_venta.create({
                        data: {
                            venta: { connect: { id_venta: venta.id_venta } },
                            requiere_flete,
                            requiere_descarga,
                            direccion_entrega,
                            costo_flete,
                            costo_descarga
                        }
                    });
                }

                // 6. Retornar la venta completa
                return await tx.venta.findUnique({
                    where: { id_venta: venta.id_venta },
                    include: {
                        detalle_venta: true,
                        servicio_venta: true,
                        comprobante_venta: true
                    }
                });
            });
        } catch (error) {
            console.error("Error al crear venta:", error);
            throw error;
        }
    }
    
    async getVentas(id_empresa: number) {
        // Obtener todas las ventas de la empresa
        return await prisma.venta.findMany({
            where: {
                id_empresa
            },
            include: {
                cliente: {
                    select: {
                        id_cliente: true,
                        nombres_apellidos: true,
                        razon_social: true,
                        dni: true,
                        ruc: true
                    }
                },
                comprobante_venta: true
            },
            orderBy: {
                id_venta: 'desc'
            }
        });
    }

    async getVentasPendientesEntrega(id_empresa: number) {
        // Obtener ventas de tipo CONTRATO con entrega PENDIENTE o PARCIAL
        return await prisma.venta.findMany({
            where: {
                id_empresa,
                tipo_venta: 'CONTRATO',
                estado_entrega: {
                    in: ['NO ENTREGADO', 'PARCIAL']
                }
            },
            include: {
                cliente: {
                    select: {
                        id_cliente: true,
                        nombres_apellidos: true,
                        razon_social: true,
                        dni: true,
                        ruc: true
                    }
                },
                comprobante_venta: true,
                detalle_venta: {
                    include: {
                        producto: true
                    }
                }
            },
            orderBy: {
                id_venta: 'desc'
            }
        });
    }
}

export default new VentaService();

