import { BaseRepository } from './BaseRepository';
import { prisma } from '@/lib/prisma'; // Asegúrate de que la ruta sea correcta

export class HornoRepository extends BaseRepository {

    constructor() {
        super(prisma.horno, "id_horno"); // Se pasa el modelo y el nombre del campo ID
    }

    async findByIdAndEmpresa(id_horno: number, id_empresa: number) {
        return prisma.horno.findFirst({
            where: {
                id_horno,
                id_empresa,
            },
        });
    }

    async findAllByEmpresa(id_empresa: number) {
        return prisma.horno.findMany({
            where: { id_empresa },
            orderBy: { id_horno: 'asc' },
        });
    }


    async findById(id_horno: number) {
        return prisma.horno.findUnique({ where: { id_horno: id_horno } });
    }

    async createHorno(data: { prefijo: string; nombre: string; cantidad_humeadores: number; cantidad_quemadores: number; id_empresa: number }) {
        return prisma.horno.create({
            data: {
                prefijo: data.prefijo,
                nombre: data.nombre,
                cantidad_humeadores: data.cantidad_humeadores,
                cantidad_quemadores: data.cantidad_quemadores,
                id_empresa: data.id_empresa, // Usar solo el id_empresa
            },
        });
    }

    async update(id_horno: number, id_empresa: number, data: any) {
        return prisma.horno.update({
            where: { id_horno, id_empresa },
            data: data
        });
    }

    async delete(id_horno: number, id_empresa: number) {
        return await prisma.horno.deleteMany({ where: { id_horno, id_empresa } });
    }

    async updateHorno(id_horno: number, id_empresa: number, data: any) {
        return prisma.horno.updateMany({
            where: { id_horno, id_empresa },
            data,
        });
    }

    async deleteHorno(id_horno: number, id_empresa: number) {
        return prisma.horno.deleteMany({
            where: { id_horno, id_empresa },
        });
    }

}