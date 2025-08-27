import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class NumeracionComprobanteRepository extends BaseRepository {
  constructor() {
    super(prisma.numeracion_comprobante, "id_numeracion_comprobante");
  }

  async findByEmpresa(id_empresa: number) {
    return prisma.numeracion_comprobante.findMany({
      where: { id_empresa },
    });
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
