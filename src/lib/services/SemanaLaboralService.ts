import { SemanaLaboralRepository } from "../repositories/SemanaLaboralRepository";
import { Prisma } from "@prisma/client";

const semanaLaboralRepository = new SemanaLaboralRepository();

export class SemanaLaboralService {
  
  async findAllByIdEmpresa(id_empresa: number) {
    return await semanaLaboralRepository.findAllByIdEmpresa(id_empresa);
  }

  async findById(id_semana_laboral: number) {
    return await semanaLaboralRepository.findById(id_semana_laboral);
  }

  async createSemanaLaboral(data: Prisma.semana_laboralCreateInput) {
    return await semanaLaboralRepository.createSemanaLaboral(data);
  }

  async updateSemanaLaboral(id_semana_laboral: number, data: Prisma.semana_laboralUpdateInput) {
    return await semanaLaboralRepository.updateSemanaLaboral(id_semana_laboral, data);
  }

  async deleteSemanaLaboral(id_semana_laboral: number, id_empresa: number) {
    return await semanaLaboralRepository.deleteSemanaLaboral(id_semana_laboral, id_empresa);
  }
}

export default new SemanaLaboralService();
