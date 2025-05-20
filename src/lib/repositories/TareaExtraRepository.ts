import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class TareaExtraRepository extends BaseRepository {
  constructor() {
    super(prisma.tarea_extra, "id_tarea_extra");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.tarea_extra.findMany({
      where: {
        personal: { id_empresa },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: { fecha: "desc" },
    });
  }

  async findById(id_tarea_extra: number) {
    return prisma.tarea_extra.findUnique({
      where: { id_tarea_extra },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }

  async createTareaExtra(data: Prisma.tarea_extraCreateInput) {
    return prisma.tarea_extra.create({ data });
  }

  async createManyTareaExtra(data: Prisma.tarea_extraCreateManyInput[]) {
    return prisma.tarea_extra.createMany({ data });
  }

  async updateTareaExtra(id: number, data: Prisma.tarea_extraUpdateInput) {
    return prisma.tarea_extra.update({
      where: { id_tarea_extra: id },
      data,
    });
  }

  async deleteTareaExtra(id: number) {
    return prisma.tarea_extra.delete({
      where: { id_tarea_extra: id },
    });
  }
}
