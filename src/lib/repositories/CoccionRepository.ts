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
            orderBy: { id_coccion: 'asc' }
        });
    }

    async findById(id_coccion: number) {
        return prisma.coccion.findUnique({
            where: { id_coccion }
        });
    };

    async createCoccion(data: Prisma.coccionCreateInput) {
        return prisma.coccion.create({
            data
        });
    }

    async updateCoccion(id_coccion: number, data: Prisma.coccionCreateInput) {
        return prisma.coccion.update({
            where: { id_coccion },
            data
        });
    }

    async deleteCoccion(id_coccion: number, id_empresa: number) {
        return prisma.coccion.delete({
            where: { id_coccion, id_empresa }
        });
    }
}
