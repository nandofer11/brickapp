import { CoccionTurnoRepository } from "../repositories/CoccionTurnoRepository";
import { Prisma } from "@prisma/client";

const coccionTurnoRepository = new CoccionTurnoRepository();

export class CoccionTurnoService {
  async findAllByEmpresa(id_empresa: number) {
    return coccionTurnoRepository.findAllByEmpresa(id_empresa);
  }

  async findById(id: number) {
    return coccionTurnoRepository.findById(id);
  }

  async createTurno(data: Prisma.coccion_turnoCreateInput) {
    return coccionTurnoRepository.create(data);
  }

  async updateTurno(id: number, data: Prisma.coccion_turnoUpdateInput) {
    return coccionTurnoRepository.updateCoccionTurno(id, data);
  }

  async deleteTurno(id: number) {
    return coccionTurnoRepository.deleteCoccionTurno(id);
  }
}

export default new CoccionTurnoService();
