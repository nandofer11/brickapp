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
            observaciones,
            fecha_estimada_entrega
        } = data;

        try {
            // Crear una venta en una única transacción
            return await prisma.$transaction(async (tx) => {
                // Determinar el estado de la venta
                let estado_venta = 'ACTIVA';
                if (estado_pago === 'CANCELADO' && estado_entrega === 'ENTREGADO') {
                    console.log('La venta cumple con las condiciones para ser CERRADA');
                    estado_venta = 'CERRADA';
                } else {
                    console.log(`La venta NO cumple con las condiciones para ser CERRADA. Estado pago: ${estado_pago}, Estado entrega: ${estado_entrega}`);
                }
                
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
                        observaciones: observaciones || '',
                        estado_venta: estado_venta as any // Cast para manejar el enum
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

                // 3. Actualizar la numeración del comprobante si existe
                if (comprobante.tipo_comprobante && comprobante.serie) {
                    console.log(`Actualizando numeración para: ${comprobante.tipo_comprobante} - ${comprobante.serie}`);
                    
                    const numeracionExistente = await tx.numeracion_comprobante.findFirst({
                        where: {
                            tipo_comprobante: comprobante.tipo_comprobante,
                            serie: comprobante.serie,
                            id_empresa: id_empresa
                        }
                    });

                    console.log('Numeración existente:', numeracionExistente);

                    if (numeracionExistente) {
                        const nuevoNumero = numeracionExistente.numero_actual + 1;
                        console.log(`Incrementando número de: ${numeracionExistente.numero_actual} a ${nuevoNumero}`);
                        
                        const numeracionActualizada = await tx.numeracion_comprobante.update({
                            where: { id_numeracion_comprobante: numeracionExistente.id_numeracion_comprobante },
                            data: { numero_actual: nuevoNumero }
                        });
                        
                        console.log('Numeración actualizada:', numeracionActualizada);
                    } else {
                        console.log('No se encontró numeración para este tipo de comprobante y serie');
                    }
                } else {
                    console.log('No se proporcionó tipo de comprobante o serie');
                }

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
    
    async getVentas(id_empresa: number, page = 1, pageSize = 20) {
        // Obtener las ventas paginadas de la empresa
        const skip = (page - 1) * pageSize;
        
        // Obtener las ventas para la página actual
        const ventas = await prisma.venta.findMany({
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
            },
            skip,
            take: pageSize
        });
        
        // Obtener el total de ventas para calcular el número total de páginas
        const totalVentas = await prisma.venta.count({
            where: {
                id_empresa
            }
        });
        
        return {
            ventas,
            meta: {
                page,
                pageSize,
                totalItems: totalVentas,
                totalPages: Math.ceil(totalVentas / pageSize)
            }
        };
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

    async actualizarEstadoVenta(id_venta: number) {
        try {
            // 1. Obtener la venta actual
            const venta = await prisma.venta.findUnique({
                where: { id_venta }
            });

            if (!venta) {
                throw new Error(`No se encontró la venta con ID: ${id_venta}`);
            }

            // 2. Determinar si la venta debe ser CERRADA o ACTIVA
            let nuevoEstado = 'ACTIVA';
            if (venta.estado_pago === 'CANCELADO' && venta.estado_entrega === 'ENTREGADO') {
                console.log(`Actualizando venta ${id_venta} a CERRADA porque estado_pago=${venta.estado_pago} y estado_entrega=${venta.estado_entrega}`);
                nuevoEstado = 'CERRADA';
            } else {
                console.log(`Actualizando venta ${id_venta} a ACTIVA porque estado_pago=${venta.estado_pago} y estado_entrega=${venta.estado_entrega}`);
            }

            // 3. Actualizar el estado de la venta
            return await prisma.venta.update({
                where: { id_venta },
                data: { 
                    estado_venta: nuevoEstado as any // Cast para manejar el enum
                }
            });
        } catch (error) {
            console.error(`Error al actualizar estado de venta ${id_venta}:`, error);
            throw error;
        }
    }

    async updateVenta(id_venta: number, data: any, id_empresa: number) {
        const {
            estado_pago,
            estado_entrega,
            forma_pago,
            tipo_comprobante,
            adelanto,
            saldo_pendiente,
            observaciones,
            detalles,
            servicios,
            total,
            fecha_estimada_entrega
        } = data;

        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Actualizar los datos básicos de la venta
                const ventaActualizada = await tx.venta.update({
                    where: { 
                        id_venta,
                        id_empresa // Asegurar que pertenece a la empresa
                    },
                    data: {
                        estado_pago,
                        estado_entrega,
                        forma_pago,
                        fecha_estimada_entrega: fecha_estimada_entrega !== undefined ? fecha_estimada_entrega : undefined,
                        adelanto: adelanto !== undefined ? Number(adelanto) : undefined,
                        saldo_pendiente: saldo_pendiente !== undefined ? Number(saldo_pendiente) : undefined,
                        observaciones: observaciones || '',
                        total: total !== undefined ? Number(total) : undefined
                    },
                });

                // 2. Actualizar detalles de venta si se proporcionaron
                if (detalles && Array.isArray(detalles)) {
                    // Obtener detalles actuales
                    const detallesActuales = await tx.detalle_venta.findMany({
                        where: { id_venta }
                    });

                    // Actualizar o crear detalles
                    for (const detalle of detalles) {
                        if (detalle.id_detalle_venta) {
                            // Actualizar detalle existente
                            await tx.detalle_venta.update({
                                where: { id_detalle_venta: detalle.id_detalle_venta },
                                data: {
                                    cantidad: Number(detalle.cantidad),
                                    precio_unitario: Number(detalle.precio_unitario)
                                    // subtotal se calcula automáticamente en la BD
                                }
                            });
                        } else if (detalle.id_producto) {
                            // Crear nuevo detalle
                            await tx.detalle_venta.create({
                                data: {
                                    id_venta,
                                    id_producto: detalle.id_producto,
                                    cantidad: Number(detalle.cantidad),
                                    precio_unitario: Number(detalle.precio_unitario)
                                }
                            });
                        }
                    }

                    // Eliminar detalles que ya no están presentes
                    const idsDetallesActualizados = detalles
                        .filter((d: any) => d.id_detalle_venta)
                        .map((d: any) => d.id_detalle_venta);
                    
                    const detallesAEliminar = detallesActuales
                        .filter(d => !idsDetallesActualizados.includes(d.id_detalle_venta));
                    
                    for (const detalle of detallesAEliminar) {
                        await tx.detalle_venta.delete({
                            where: { id_detalle_venta: detalle.id_detalle_venta }
                        });
                    }
                }

                // 3. Actualizar servicios de venta si se proporcionaron
                if (servicios && Array.isArray(servicios) && servicios.length > 0) {
                    const servicio = servicios[0]; // Normalmente solo hay un servicio por venta
                    
                    // Buscar si ya existe un servicio para esta venta
                    const servicioExistente = await tx.servicio_venta.findFirst({
                        where: { id_venta }
                    });

                    if (servicioExistente) {
                        // Actualizar servicio existente
                        await tx.servicio_venta.update({
                            where: { id_servicio_venta: servicioExistente.id_servicio_venta },
                            data: {
                                requiere_flete: servicio.requiere_flete ? 1 : 0,
                                requiere_descarga: servicio.requiere_descarga ? 1 : 0,
                                direccion_entrega: servicio.direccion_entrega || '',
                                costo_flete: Number(servicio.costo_flete || 0),
                                costo_descarga: Number(servicio.costo_descarga || 0)
                            }
                        });
                    } else if (servicio.requiere_flete || servicio.requiere_descarga) {
                        // Crear nuevo servicio si se requiere
                        await tx.servicio_venta.create({
                            data: {
                                id_venta,
                                requiere_flete: servicio.requiere_flete ? 1 : 0,
                                requiere_descarga: servicio.requiere_descarga ? 1 : 0,
                                direccion_entrega: servicio.direccion_entrega || '',
                                costo_flete: Number(servicio.costo_flete || 0),
                                costo_descarga: Number(servicio.costo_descarga || 0)
                            }
                        });
                    }
                }

                // 4. Actualizar comprobante si se proporcionó tipo_comprobante
                if (tipo_comprobante) {
                    const comprobanteExistente = await tx.comprobante_venta.findFirst({
                        where: { id_venta }
                    });

                    if (comprobanteExistente) {
                        if (tipo_comprobante !== 'NINGUNO') {
                            await tx.comprobante_venta.update({
                                where: { id_comprobante_venta: comprobanteExistente.id_comprobante_venta },
                                data: { tipo_comprobante }
                            });
                        } else {
                            // Si el tipo es NINGUNO, eliminar el comprobante
                            await tx.comprobante_venta.delete({
                                where: { id_comprobante_venta: comprobanteExistente.id_comprobante_venta }
                            });
                        }
                    } else if (tipo_comprobante !== 'NINGUNO') {
                        // Crear nuevo comprobante si no existe y no es NINGUNO
                        await tx.comprobante_venta.create({
                            data: {
                                id_venta,
                                tipo_comprobante
                            }
                        });
                    }
                }

                // 5. Actualizar estado de la venta basado en estado_pago y estado_entrega
                let estado_venta = 'ACTIVA';
                if (estado_pago === 'CANCELADO' && estado_entrega === 'ENTREGADO') {
                    estado_venta = 'CERRADA';
                }

                await tx.venta.update({
                    where: { id_venta },
                    data: {
                        estado_venta: estado_venta as any
                    }
                });

                // Retornar la venta actualizada con todos sus relacionados
                return await tx.venta.findUnique({
                    where: { id_venta },
                    include: {
                        cliente: true,
                        detalle_venta: {
                            include: {
                                producto: true
                            }
                        },
                        servicio_venta: true,
                        comprobante_venta: true
                    }
                });
            });
        } catch (error) {
            console.error('Error actualizando venta:', error);
            throw error;
        }
    }
}

export default new VentaService();
