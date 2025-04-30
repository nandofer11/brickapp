// import { PrismaClient, Personal } from "@prisma/client";
import PersonalRepository from "../repositories/PersonalRepository";

const personalRepository = new PersonalRepository();

class PersonalService {
  async getAllByEmpresa(id_empresa: number) {
    return await personalRepository.getAllByEmpresa(id_empresa);
  }

//   async getById(id_personal: number): Promise<Personal | null> {
//     return this.repository.findById(id_personal);
//   }

//   async getByDni(dni: string): Promise<Personal | null> {
//     return this.repository.findByDni(dni);
//   }

  async createPersonal(data: any) {
    return await personalRepository.createPersonal(data);
  }

  async updatePersonal(id_personal: number, id_empresa: number, data: any) {
    return await personalRepository.updatePersonal(id_personal, id_empresa, data);
  }

  async deletePersonal(id_personal: number, id_empresa: number) {
    return await personalRepository.deletePersonal(id_personal, id_empresa);
  }
}

export default new PersonalService();