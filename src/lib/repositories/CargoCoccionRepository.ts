import { BaseRepository } from './BaseRepository';
import { prisma } from '@/lib/prisma'; // Asegúrate de que la ruta sea correcta

export class CargoCoccionRepository extends BaseRepository {
    constructor() {
        super(prisma.cargo_coccion, 'id_cargo_coccion'); // Se pasa el modelo y el nombre del campo ID
    }

  async findAllByEmpresa(id_empresa:number) {
    return prisma.cargo_coccion.findMany({
        where: {
            id_empresa,
        },
        orderBy: { id_cargo_coccion: 'asc' },
    });
  }

  async findById(id_cargo_coccion: number) {
    return prisma.cargo_coccion.findUnique({
      where: { id_cargo_coccion: id_cargo_coccion },
    });
  }

  async createCargoCoccion(data: {nombre_cargo: string, costo_cargo: number, id_empresa: number, id_horno: number}) {
    return prisma.cargo_coccion.create({
      data,
    });
  }

  async updateCargoCoccion(id: number, data: { nombre_cargo?: string; costo_cargo?: number; id_horno?: number }) {
    return prisma.cargo_coccion.update({
      where: { id_cargo_coccion: id },
      data,
    });
  }

  async update(id_cargo_coccion: number, id_empresa:number, data: any) {
    return prisma.cargo_coccion.update({
      where: { id_cargo_coccion, id_empresa },
      data: data,
    });
  }

  async delete(id_cargo_coccion: number, id_empresa: number) {
    return prisma.cargo_coccion.delete({
      where: { id_cargo_coccion, id_empresa },
    });
  }
}
