import { BaseRepository } from "./BaseRepository";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AsistenciaRepository extends BaseRepository {
  constructor() {
    super(prisma.asistencia, "id_asistencia");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.asistencia.findMany({
      where: {
        personal: {
          id_empresa,
        },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: { fecha: "asc" },
    });
  }

  async findById(id_asistencia: number) {
    return prisma.asistencia.findUnique({
      where: { id_asistencia },
      include: {
        personal: true,
        semana_laboral: true,
      },
    });
  }

  async createAsistencia(data: Prisma.asistenciaCreateManyInput[]) {
    return prisma.asistencia.createMany({ data });
  }

  async updateAsistencia(id: number, data: Prisma.asistenciaCreateManyInput) {
    return prisma.asistencia.update({
      where: { id_asistencia: id },
      data,
    });
  }

  async deleteAsistencia(id_asistencia: number) {
    return prisma.asistencia.delete({
      where: { id_asistencia },
    });
  }
}

export default new AsistenciaRepository();
