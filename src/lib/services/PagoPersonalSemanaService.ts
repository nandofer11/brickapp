import { PagoPersonalSemanaRepository } from "../repositories/PagoPersonalSemanaRepository";
import { Prisma } from "@prisma/client";

const repository = new PagoPersonalSemanaRepository();

export class PagoPersonalSemanaService {
  async findAllByEmpresa(id_empresa: number) {
    return repository.findAllByEmpresa(id_empresa);
  }

  // Agregar método para buscar por id_semana_laboral
  async findBySemanaLaboral(id_semana: number) {
    try {
      const pagos = await repository.findMany({
        where: {
          id_semana_laboral: Number(id_semana),
        },
        include: {
          personal: true,
          semana_laboral: true,
        },
      });
      return pagos;
    } catch (error) {
      console.error("Error al buscar pagos por semana:", error);
      throw new Error("Error al buscar pagos por semana laboral");
    }
  }

  async findById(id: number) {
    return repository.findById(id);
  }

  // Mejorar el manejo de errores en la creación
  async create(data: any) {
    try {
      return repository.create(data);
    } catch (error) {
      console.error("Error al crear pago personal semana:", error);
      throw new Error("Error al crear pago de personal por semana");
    }
  }

  async update(id: number, data: Prisma.pago_personal_semanaUpdateInput) {
    return repository.updatePagoPersonalSemana(id, data);
  }

  async delete(id: number) {
    return repository.delete(id);
  }
}

export default new PagoPersonalSemanaService();
