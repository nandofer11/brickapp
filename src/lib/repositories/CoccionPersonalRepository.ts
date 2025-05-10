import { Prisma } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";
import {prisma} from "@/lib/prisma"; 

export class CoccionPersonalRepository extends BaseRepository {
  constructor() {
    super(prisma.coccion_personal, "id_coccion_personal"); // Se pasa el modelo y el nombre del campo ID
  }

  async createCoccionPersonal(data: Prisma.coccion_personalCreateInput) {
    return prisma.coccion_personal.create({
      data
    });
  }

  async getCoccionPersonal(id_coccion_personal: number) {
    return await prisma.coccion_personal.findUnique({
      where: { id_coccion_personal }
    });
  }

  async getAllCoccionPersonal() {
    return await prisma.coccion_personal.findMany();
  }

  async updateCoccionPersonal(id_coccion_personal: number, data: Prisma.coccion_personalUpdateInput) {
    return await prisma.coccion_personal.update({
      where: { id_coccion_personal },
      data
    });
  }

  async deleteCoccionPersonal(id_coccion_personal: number) {
    return await prisma.coccion_personal.delete({
      where: { id_coccion_personal }
    });
  }
}

