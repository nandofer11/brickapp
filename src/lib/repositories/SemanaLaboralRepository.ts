import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class SemanaLaboralRepository extends BaseRepository {
  constructor() {
    super(prisma.semana_laboral, "id_semana_laboral");
  }

  async findAllByIdEmpresa(id_empresa: number) {
    return prisma.semana_laboral.findMany({
      where: { id_empresa },
      orderBy: { id_semana_laboral: "asc" },
    });
  }

  async findById(id_semana_laboral: number) {
    return prisma.semana_laboral.findUnique({
      where: { id_semana_laboral },
    });
  }

  async createSemanaLaboral(data: Prisma.semana_laboralCreateInput) {
    return prisma.semana_laboral.create({ data });
  }

  async updateSemanaLaboral(id: number, data: Prisma.semana_laboralUpdateInput) {
    return prisma.semana_laboral.update({
      where: { id_semana_laboral: id },
      data,
    });
  }

  async deleteSemanaLaboral(id_semana_laboral: number, id_empresa: number) {
    return prisma.semana_laboral.delete({
      where: { id_semana_laboral, id_empresa },
    });
  }
}
