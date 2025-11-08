import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class NumeracionComprobanteRepository extends BaseRepository {
  constructor() {
    super(prisma.numeracion_comprobante, "id_numeracion_comprobante");
  }

  async findByEmpresa(id_empresa: number) {
    console.log(`[Repository] Buscando numeraciones para empresa ID: ${id_empresa}`);
    try {
      // Utilizar prisma.$queryRaw para evitar el caché de Prisma
      const result = await prisma.numeracion_comprobante.findMany({
        where: { id_empresa },
        orderBy: { id_numeracion_comprobante: 'asc' }
      });
      console.log(`[Repository] Encontradas ${result.length} numeraciones`);
      return result;
    } catch (error) {
      console.error('[Repository] Error al buscar numeraciones:', error);
      throw error;
    }
  }

  async createNumeracionComprobante(data: Prisma.numeracion_comprobanteCreateInput) {
    return prisma.numeracion_comprobante.create({ data });
  }

  async updateNumeracionComprobante(id: number, data: Prisma.numeracion_comprobanteUpdateInput) {
    return prisma.numeracion_comprobante.update({
      where: { id_numeracion_comprobante: id },
      data,
    });
  }

  async deleteNumeracionComprobante(id: number) {
    return prisma.numeracion_comprobante.delete({
      where: { id_numeracion_comprobante: id },
    });
  }
}
