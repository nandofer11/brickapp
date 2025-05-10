import {CoccionPersonalRepository} from "../repositories/CoccionPersonalRepository";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const coccionPersonalRepository = new CoccionPersonalRepository();

export class CoccionPersonalService {

  async createCoccionPersonal (data: Prisma.coccion_personalCreateInput) {
    return await coccionPersonalRepository.createCoccionPersonal(data);
  }

  async getCoccionPersonal(id: number) {
    return await coccionPersonalRepository.getCoccionPersonal(id);
  }

  async getAllCoccionPersonal() {
    return await coccionPersonalRepository.getAllCoccionPersonal();
  }

  async updateCoccionPersonal(id: number, data: Prisma.coccion_personalUpdateInput) {
    return await coccionPersonalRepository.updateCoccionPersonal(id, data);
  }

  async deleteCoccionPersonal(id: number) {
    return await coccionPersonalRepository.deleteCoccionPersonal(id);
  }

  async createManyCoccionPersonal(data: Prisma.coccion_personalCreateManyInput[]) {
    return await prisma.$transaction(async (tx) => {
      return await tx.coccion_personal.createMany({
        data: data
      });
    });
  }
}
