import { AdelantoPagoRepository } from "../repositories/AdelantoPagoRepository";
import { Prisma } from "@prisma/client";

const adelantoPagoRepository = new AdelantoPagoRepository();

export class AdelantoPagoService {
  async findAllByEmpresa(id_empresa: number) {
    return adelantoPagoRepository.findAllByEmpresa(id_empresa);
  }

  async findById(id_adelanto_pago: number) {
    return adelantoPagoRepository.findById(id_adelanto_pago);
  }

  async createAdelanto(data: Prisma.adelanto_pagoCreateInput) {
    return adelantoPagoRepository.createAdelanto(data);
  }

  async updateAdelanto(id_adelanto_pago: number, data: Prisma.adelanto_pagoUpdateInput) {
    return adelantoPagoRepository.updateAdelanto(id_adelanto_pago, data);
  }

  async deleteAdelanto(id_adelanto_pago: number) {
    return adelantoPagoRepository.deleteAdelanto(id_adelanto_pago);
  }
}

export default new AdelantoPagoService();
