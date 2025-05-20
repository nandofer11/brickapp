import { TareaExtraRepository } from "../repositories/TareaExtraRepository";
import { Prisma } from "@prisma/client";

const tareaExtraRepository = new TareaExtraRepository();

export class TareaExtraService {
  async findAllByEmpresa(id_empresa: number) {
    return tareaExtraRepository.findAllByEmpresa(id_empresa);
  }

  async findById(id_tarea_extra: number) {
    return tareaExtraRepository.findById(id_tarea_extra);
  }

  async createTareaExtra(data: Prisma.tarea_extraCreateInput) {
    return tareaExtraRepository.createTareaExtra(data);
  }

  async createManyTareaExtra(data: Prisma.tarea_extraCreateManyInput[]) {
    return tareaExtraRepository.createManyTareaExtra(data);
  }

  async updateTareaExtra(id: number, data: Prisma.tarea_extraUpdateInput) {
    return tareaExtraRepository.updateTareaExtra(id, data);
  }

  async deleteTareaExtra(id: number) {
    return tareaExtraRepository.deleteTareaExtra(id);
  }
}

export default new TareaExtraService();
