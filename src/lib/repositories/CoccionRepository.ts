import { BaseRepository } from './BaseRepository';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class CoccionRepository extends BaseRepository {
    constructor() {
        super(prisma.coccion, 'id_coccion');
    }

    async findAllByEmpresa(id_empresa: number) {
        return prisma.coccion.findMany({
            where: { id_empresa },
            orderBy: { id_coccion: 'desc' },
            include: {
                horno: {
                    select: {
                        id_horno: true,
                        prefijo: true,
                        nombre: true,
                        cantidad_humeadores: true,
                        cantidad_quemadores: true
                    }
                },
                semana_laboral: true
            }
        });
    }

    async findById(id_coccion: number) {
        return prisma.coccion.findUnique({
            where: { id_coccion },
            include: {
                horno: true,
                semana_laboral: true
            }
        });
    }

    async createCoccion(data: Prisma.coccionCreateInput) {
        return prisma.coccion.create({
            data,
            include: {
                horno: true,
                semana_laboral: true
            }
        });
    }

    async updateCoccion(id_coccion: number, data: any) {
        // Eliminar id_coccion si por error llega aquí
        const { id_coccion: _, ...dataSinId } = data;
        return await prisma.coccion.update({
            where: { id_coccion },
            data: dataSinId,
            include: {
                horno: true,
                semana_laboral: true
            }
        });
    }

    async deleteCoccion(id_coccion: number, id_empresa: number) {
        return prisma.coccion.delete({
            where: { id_coccion, id_empresa }
        });
    }

    async existeCoccionActivaEnSemanaYHorno(semana_id: number, horno_id: number, id_empresa: number) {
        const coccion = await prisma.coccion.findFirst({
            where: {
                semana_laboral_id_semana_laboral: semana_id,
                horno_id_horno: horno_id,
                id_empresa: id_empresa,
                estado: {
                    in: ['Programado', 'En Proceso']
                }
            }
        });
        
        return coccion !== null;
    }

    async findByIdWithRelations(id_coccion: number) {
        return await prisma.coccion.findUnique({
            where: { id_coccion },
            include: {
                horno: {
                    select: {
                        id_horno: true,
                        prefijo: true,
                        nombre: true,
                        cantidad_humeadores: true,
                        cantidad_quemadores: true
                    }
                },
                semana_laboral: true,
                coccion_personal: {
                    include: {
                        personal: true,
                        cargo_coccion: true
                    }
                }
            }
        });
    }

    async deleteCoccionCompleta(id_coccion: number) {
        if (!id_coccion || typeof id_coccion !== "number") {
            throw new Error("id_coccion es requerido y debe ser un número");
        }

        return await prisma.$transaction(async (prisma) => {
            // Primero eliminar registros de coccion_turno
            await prisma.coccion_turno.deleteMany({
                where: { coccion_id_coccion: id_coccion }
            });

            // Luego eliminar la cocción
            return await prisma.coccion.delete({
                where: { id_coccion }
            });
        });
    }

    async updateCoccionCompleta(id_coccion: number, coccionData: any, operadoresData: any[]) {
        if (!id_coccion || typeof id_coccion !== "number") {
            throw new Error("id_coccion es requerido y debe ser un número");
        }

        // Transformar campos
        let dataToUpdate = { ...coccionData };
        
        // Convertir fechas a formato ISO
        if (dataToUpdate.fecha_encendido) {
            dataToUpdate.fecha_encendido = new Date(dataToUpdate.fecha_encendido).toISOString();
        }
        if (dataToUpdate.fecha_apagado) {
            dataToUpdate.fecha_apagado = new Date(dataToUpdate.fecha_apagado).toISOString();
        }

        // Transformar campo semana_trabajo a semana_laboral
        if ('semana_trabajo_id_semana_trabajo' in dataToUpdate) {
            dataToUpdate.semana_laboral_id_semana_laboral = dataToUpdate.semana_trabajo_id_semana_trabajo;
            delete dataToUpdate.semana_trabajo_id_semana_trabajo;
        }

        return await prisma.$transaction(async (prisma) => {
            // Eliminar operadores existentes
            await prisma.coccion_personal.deleteMany({
                where: { coccion_id_coccion: id_coccion }
            });

            // Actualizar cocción
            const coccionActualizada = await prisma.coccion.update({
                where: { id_coccion },
                data: dataToUpdate,
                include: {
                    horno: true,
                    semana_laboral: true,
                    coccion_personal: {
                        include: {
                            personal: true,
                            cargo_coccion: true
                        }
                    }
                }
            });

            // Crear nuevos operadores
            if (operadoresData?.length) {
                await prisma.coccion_personal.createMany({
                    data: operadoresData.map(op => ({
                        ...op,
                        coccion_id_coccion: id_coccion
                    }))
                });
            }

            // Retornar cocción actualizada con todas sus relaciones
            return prisma.coccion.findUnique({
                where: { id_coccion },
                include: {
                    horno: true,
                    semana_laboral: true,
                    coccion_personal: {
                        include: {
                            personal: true,
                            cargo_coccion: true
                        }
                    }
                }
            });
        });
    }

}
