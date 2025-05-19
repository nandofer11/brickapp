import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AdelantoPagoRepository extends BaseRepository {
  constructor() {
    super(prisma.adelanto_pago, "id_adelanto_pago");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.adelanto_pago.findMany({
      where: {
        personal: { id_empresa },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });
  }

  async findById(id_adelanto_pago: number) {
    return prisma.adelanto_pago.findUnique({
      where: { id_adelanto_pago },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }

  async createAdelanto(data: Prisma.adelanto_pagoCreateInput) {
    return prisma.adelanto_pago.create({ data });
  }

  async updateAdelanto(id: number, data: Prisma.adelanto_pagoUpdateInput) {
    return prisma.adelanto_pago.update({
      where: { id_adelanto_pago: id },
      data,
    });
  }

  async deleteAdelanto(id: number) {
    return prisma.adelanto_pago.delete({
      where: { id_adelanto_pago: id },
    });
  }
}
