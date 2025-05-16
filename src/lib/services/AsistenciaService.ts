import {AsistenciaRepository} from "../repositories/AsistenciaRepository";
import { Prisma } from "@prisma/client";

const asistenciaRepository = new AsistenciaRepository();

export class AsistenciaService {
  async findAllByEmpresa(id_empresa: number) {
    return await asistenciaRepository.findAllByEmpresa(id_empresa);
  }

  async findById(id_asistencia: number) {
    return await asistenciaRepository.findById(id_asistencia);
  }

  async createAsistencia(data: Prisma.asistenciaCreateManyInput[]) {
    return await asistenciaRepository.createAsistencia(data);
  }

  async updateAsistencia(id_asistencia: number, data: Prisma.asistenciaCreateManyInput) {
    return await asistenciaRepository.updateAsistencia(id_asistencia, data);
  }

  async deleteAsistencia(id_asistencia: number) {
    return await asistenciaRepository.deleteAsistencia(id_asistencia);
  }
}

export default new AsistenciaService();
