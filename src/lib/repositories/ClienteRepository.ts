import { BaseRepository } from './BaseRepository';
import { prisma } from '@/lib/prisma';

export class ClienteRepository extends BaseRepository {
    constructor() {
        super(prisma.cliente, 'id_cliente');
    }

    async findAllByEmpresa(id_empresa: number) {
        return prisma.cliente.findMany({
            where: { id_empresa },
            orderBy: { nombres_apellidos: 'asc' }
        });
    }

    async create(data: any) {
        return prisma.cliente.create({
            data: {
                ...data,
                created_at: new Date()
            }
        });
    }

    async update(id: number, data: any) {
        return prisma.cliente.update({
            where: { id_cliente: id },
            data
        });
    }

    async delete(id: number) {
        return prisma.cliente.delete({
            where: { id_cliente: id }
        });
    }
}
