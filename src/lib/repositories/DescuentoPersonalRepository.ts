import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class DescuentoPersonalRepository extends BaseRepository {
  constructor() {
    super(prisma.descuento_personal, "id_descuento_personal");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.descuento_personal.findMany({
      where: {
        personal: {
          id_empresa,
        },
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

  async findById(id: number) {
    return prisma.descuento_personal.findUnique({
      where: {
        id_descuento_personal: id,
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }

  async createDescuento(data: Prisma.descuento_personalCreateInput) {
    return prisma.descuento_personal.create({
      data,
    });
  }

  async updateDescuento(id: number, data: Prisma.descuento_personalUpdateInput) {
    return prisma.descuento_personal.update({
      where: { id_descuento_personal: id },
      data,
    });
  }

  async deleteDescuento(id: number) {
    return prisma.descuento_personal.delete({
      where: { id_descuento_personal: id },
    });
  }

  async findByPersonalAndFecha(id_personal: number, fechaInicio: Date, fechaFin: Date) {
    return prisma.descuento_personal.findMany({
      where: {
        id_personal,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        }
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }
}
