import { BaseRepository } from './BaseRepository';
import { prisma } from '@/lib/prisma';

export class CategoriaRepository extends BaseRepository {
    constructor() {
        super(prisma.categoria, 'id_categoria');
    }

    async findAllByEmpresa(id_empresa: number) {
        return prisma.categoria.findMany({
            where: { id_empresa },
            orderBy: { nombre: 'asc' }
        });
    }

    async create(data: any) {
        return prisma.categoria.create({ data });
    }

    async update(id: number, data: any) {
        return prisma.categoria.update({
            where: { id_categoria: id },
            data
        });
    }

    async delete(id: number) {
        return prisma.categoria.delete({
            where: { id_categoria: id }
        });
    }
}
