import { NumeracionComprobanteRepository } from "../repositories/NumeracionComprobanteRepository";
import { Prisma } from "@prisma/client";

const repository = new NumeracionComprobanteRepository();

export class NumeracionComprobanteService {
  async findByEmpresa(id_empresa: number) {
    return await repository.findByEmpresa(id_empresa);
  }

  async findById(id: number) {
    return await repository.findById(id, 0); // id_empresa no se usa en este método
  }

  async create(data: Prisma.numeracion_comprobanteCreateInput) {
    return await repository.createNumeracionComprobante(data);
  }

  async update(id: number, data: Prisma.numeracion_comprobanteUpdateInput) {
    return await repository.updateNumeracionComprobante(id, data);
  }

  async delete(id: number) {
    return await repository.deleteNumeracionComprobante(id);
  }
}

export default new NumeracionComprobanteService();
