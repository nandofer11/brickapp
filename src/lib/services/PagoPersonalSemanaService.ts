import { PagoPersonalSemanaRepository } from "../repositories/PagoPersonalSemanaRepository";
import { Prisma } from "@prisma/client";

const repository = new PagoPersonalSemanaRepository();

export class PagoPersonalSemanaService {
  async findAllByEmpresa(id_empresa: number) {
    return repository.findAllByEmpresa(id_empresa);
  }

  // Método para buscar pagos por rango de fechas
  async findByFechaRango(fechaInicio: string, fechaFin: string, id_empresa: number) {
    try {
      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);
      
      // Ajustar la hora para incluir todo el día
      fechaInicioObj.setHours(0, 0, 0, 0);
      fechaFinObj.setHours(23, 59, 59, 999);

      const pagos = await repository.findMany({
        where: {
          fecha_pago: {
            gte: fechaInicioObj,
            lte: fechaFinObj
          },
          personal: {
            id_empresa: Number(id_empresa)
          },
          estado: "Pagado"  // Solo incluir pagos con estado "Pagado"
        },
        include: {
          personal: true,
          semana_laboral: true
        },
        orderBy: {
          fecha_pago: 'asc'
        }
      });
      return pagos;
    } catch (error) {
      console.error("Error al buscar pagos por rango de fechas:", error);
      throw new Error("Error al buscar pagos por rango de fechas");
    }
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
