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

  async findBySemana(id_semana_laboral: number, id_empresa: number) {
  return await asistenciaRepository.findBySemana(id_semana_laboral, id_empresa);
}


  async findByFechaAndSemana(fecha: string, id_semana_laboral: number, id_empresa: number) {
    // Crear fecha inicio y fin para el día específico
    const fechaBase = new Date(fecha);
    const fechaInicio = new Date(
      fechaBase.getFullYear(),
      fechaBase.getMonth(),
      fechaBase.getDate()
    );
    const fechaFin = new Date(
      fechaBase.getFullYear(),
      fechaBase.getMonth(),
      fechaBase.getDate(),
      23, 59, 59, 999
    );

    return await asistenciaRepository.findByFechaAndSemana(fechaInicio, fechaFin, id_semana_laboral, id_empresa);
  }
}

export default new AsistenciaService();
