// import { PrismaClient, Personal } from "@prisma/client";
import PersonalRepository from "../repositories/PersonalRepository";
import {prisma} from "@/lib/prisma";

const personalRepository = new PersonalRepository();

class PersonalService {
  async getAllByEmpresa(id_empresa: number) {
    return await personalRepository.getAllByEmpresa(id_empresa);
  }

  async createPersonal(data: any) {
    return await personalRepository.createPersonal(data);
  }

  async updatePersonal(id_personal: number, id_empresa: number, data: any) {
    return await personalRepository.updatePersonal(id_personal, id_empresa, data);
  }

  async deletePersonal(id_personal: number, id_empresa: number) {
  try {
    return await prisma.personal.deleteMany({
      where: {
        id_personal: id_personal,
        id_empresa: id_empresa,
      },
    });
  } catch (error: any) {
    // Detectar error de restricción de clave foránea
    if (error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
      throw new Error("No se puede eliminar este personal porque tiene registros asociados. Cambie su estado a Inactivo en lugar de eliminarlo.");
    }
    throw error; // Re-lanzar otros errores
  }
}
}

export default new PersonalService();