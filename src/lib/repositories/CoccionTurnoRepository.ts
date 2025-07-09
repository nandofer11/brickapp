import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

export class CoccionTurnoRepository extends BaseRepository {
  constructor() {
    super(prisma.coccion_turno, "id_coccion_turno");
  }

  async findAllByEmpresa(id_empresa: number) {
    return prisma.coccion_turno.findMany({
      where: {
        coccion: {
          id_empresa,
        },
      },
      include: {
        coccion: true,
        cargo_coccion: true,
      },
      orderBy: {
        fecha: "asc",
      },
    });
  }

  async findById(id: number) {
    return prisma.coccion_turno.findUnique({
      where: {
        id_coccion_personal: id,
      },
      include: {
        coccion: true,
        cargo_coccion: true,
      },
    });
  }

  // Renombrar método para mantener consistencia con el servicio
  async create(data: Prisma.coccion_turnoCreateInput) {
    return prisma.coccion_turno.create({ data });
  }

  async updateCoccionTurno(id: number, data: Prisma.coccion_turnoUpdateInput) {
    return prisma.coccion_turno.update({
      where: { id_coccion_personal: id },
      data,
    });
  }

  async deleteCoccionTurno(id: number) {
    return prisma.coccion_turno.delete({
      where: { id_coccion_personal: id },
    });
  }
}
