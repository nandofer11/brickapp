import { BaseRepository } from './BaseRepository';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ProductoRepository extends BaseRepository {
    constructor() {
        super(prisma.producto, 'id_producto');
    }

    async findAllByEmpresa(id_empresa: number) {
        return prisma.producto.findMany({
            where: { id_empresa },
            include: {
                categoria: true
            },
            orderBy: { nombre: 'asc' }
        });
    }

    async create(data: any) {
        const { id_categoria, id_empresa, ...restData } = data;
        
        return prisma.producto.create({
            data: {
                ...restData,
                categoria: {
                    connect: { id_categoria }
                },
                empresa: {
                    connect: { id_empresa }
                }
            },
            include: {
                categoria: true
            }
        });
    }

    async update(id: number, data: any) {
        const { categoria_id_categoria, ...restData } = data;
        
        return prisma.producto.update({
            where: { id_producto: id },
            data: {
                ...restData,
                categoria: categoria_id_categoria ? {
                    connect: { id_categoria: categoria_id_categoria }
                } : undefined
            },
            include: {
                categoria: true
            }
        });
    }

    async delete(id: number) {
        return prisma.producto.delete({
            where: { id_producto: id }
        });
    }
}
