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

  async findBySemana(id_semana_laboral: number, id_empresa: number) {
    return prisma.asistencia.findMany({
      where: {
        id_semana_laboral,
        personal: {
          id_empresa,
        },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        fecha: "asc",
      },
    });
  }

  async findByPersonal(id_personal: number, id_empresa: number) {
    return prisma.asistencia.findMany({
      where: {
        id_personal,
        personal: {
          id_empresa,
        },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        fecha: "asc",
      },
    });
  }

  async findByPersonalAndSemana(id_personal: number, id_semana_laboral: number, id_empresa: number) {
    return prisma.asistencia.findMany({
      where: {
        id_personal,
        id_semana_laboral,
        personal: {
          id_empresa,
        },
      },
      include: {
        personal: true,
        semana_laboral: true,
      },
      orderBy: {
        fecha: "asc",
      },
    });
  }

  async findByFechaAndSemana(fechaInicio: Date, fechaFin: Date, id_semana_laboral: number, id_empresa: number) {
    return await prisma.asistencia.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        id_semana_laboral: id_semana_laboral,
        semana_laboral: {
          id_empresa: id_empresa
        }
      },
      orderBy: {
        id_personal: 'asc'
      }
    });
  }
}

export default new AsistenciaRepository();
