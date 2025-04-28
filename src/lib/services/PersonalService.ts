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

  async create(data: any) {
    return await personalRepository.createPersonal(data);
  }

//   async update(id_personal: number, data: Partial<Personal>): Promise<Personal> {
//     return this.repository.update(id_personal, data);
//   }

//   async delete(id_personal: number): Promise<Personal> {
//     return this.repository.delete(id_personal);
//   }
}

export default new PersonalService();