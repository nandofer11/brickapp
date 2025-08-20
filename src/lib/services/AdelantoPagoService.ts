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

  async findByPersonalAndFecha(id_personal: number, fechaInicio: Date, fechaFin: Date, estado?: string) {
    return adelantoPagoRepository.findByPersonalAndFecha(id_personal, fechaInicio, fechaFin, estado);
  }


  async addDetalle(id_adelanto_pago: number, data: Prisma.adelanto_pago_detalleCreateInput) {
    return adelantoPagoRepository.addDetalle(id_adelanto_pago, data);
  }

  async getDetalles(id_adelanto_pago: number) {
    return adelantoPagoRepository.getDetalles(id_adelanto_pago);
  }

  async getSaldo(id_adelanto_pago: number) {
    return adelantoPagoRepository.getSaldo(id_adelanto_pago);
  }


}

export default new AdelantoPagoService();
