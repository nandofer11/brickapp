import { DescuentoPersonalRepository } from "../repositories/DescuentoPersonalRepository";
import { Prisma } from "@prisma/client";

const descuentoRepo = new DescuentoPersonalRepository();

export class DescuentoPersonalService {
  async findAllByEmpresa(id_empresa: number) {
    return descuentoRepo.findAllByEmpresa(id_empresa);
  }

  async findById(id_descuento_personal: number) {
    return descuentoRepo.findById(id_descuento_personal);
  }

  async createDescuento(data: Prisma.descuento_personalCreateInput) {
    return descuentoRepo.createDescuento(data);
  }

  async updateDescuento(id: number, data: Prisma.descuento_personalUpdateInput) {
    return descuentoRepo.updateDescuento(id, data);
  }

  async deleteDescuento(id: number) {
    return descuentoRepo.deleteDescuento(id);
  }

  async findByPersonalAndFecha(id_personal: number, fechaInicio: Date, fechaFin: Date) {
    return descuentoRepo.findByPersonalAndFecha(id_personal, fechaInicio, fechaFin);
  }
}

export default new DescuentoPersonalService();
