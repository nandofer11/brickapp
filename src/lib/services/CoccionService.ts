import {Prisma} from '@prisma/client';
import { CoccionRepository } from '../repositories/CoccionRepository';
import { prisma } from "@/lib/prisma";

const coccionRepository = new CoccionRepository();

export class CoccionService {

  async findAllByEmpresa(id_empresa: number) {
    return await coccionRepository.findAllByEmpresa(id_empresa);
  }

  async findById(id: number){
    return await coccionRepository.findById(id);
  }

  async createCoccion(data: Prisma.coccionCreateInput){
    return await coccionRepository.createCoccion(data);
  }

  async updateCoccion(id_coccion: number, data: Prisma.coccionCreateInput) {
    return await coccionRepository.updateCoccion(id_coccion, data);
  }

  async deleteCoccion(id_coccion: number, id_empresa: number) {
    return await coccionRepository.deleteCoccion(id_coccion, id_empresa);
  }

  async createCoccionWithOperadores(coccionData: any, operadoresData: any[]) {
    const nuevaCoccion = await this.createCoccion(coccionData);
    
    if (operadoresData?.length) {
      await prisma.coccion_personal.createMany({
        data: operadoresData.map(op => ({
          personal_id_personal: op.personal_id_personal,
          cargo_coccion_id_cargo_coccion: op.cargo_coccion_id_cargo_coccion,
          coccion_id_coccion: nuevaCoccion.id_coccion
        }))
      });
    }

    return nuevaCoccion;
  }
}

export default new CoccionService();
