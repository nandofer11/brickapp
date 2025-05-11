import {Prisma} from '@prisma/client';
import { CoccionRepository } from '../repositories/CoccionRepository';
import { prisma } from "@/lib/prisma";

const coccionRepository = new CoccionRepository();

export class CoccionService {

  async findAllByEmpresa(idEmpresa: number) {
    console.log('Consultando cocciones para empresa:', idEmpresa);
    return await prisma.coccion.findMany({
      where: {
        id_empresa: idEmpresa
      },
      orderBy: {
        id_coccion: 'desc'
      }
    });
  }

  async findById(id: number){
    return await coccionRepository.findById(id);
  }

  async createCoccion(data: Prisma.coccionCreateInput){
    return await coccionRepository.createCoccion(data);
  }

  async updateCoccion(id_coccion: number, data: Prisma.coccionCreateInput) {
    // Eliminar id_coccion del objeto data si existe
    const { id_coccion: _, ...dataSinId } = data as any;
    return await coccionRepository.updateCoccion(id_coccion, dataSinId);
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

  public static async validarCoccionPorSemanaYHorno(
    semana_laboral_id: number,
    horno_id: number,
    id_empresa: number
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/coccion/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          semana_laboral_id,
          horno_id,
          id_empresa,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al validar cocción');
      }

      return data;
    } catch (error) {
      console.error('Error en validación:', error);
      throw error;
    }
  }

  async findByIdWithRelations(id_coccion: number) {
    return await coccionRepository.findByIdWithRelations(id_coccion);
  }

  async updateCoccionCompleta(id_coccion: number, coccionData: any, operadoresData: any[]) {
    // Eliminar id_coccion del objeto coccionData si existe
    const { id_coccion: _, ...dataSinId } = coccionData;
    return await coccionRepository.updateCoccionCompleta(id_coccion, dataSinId, operadoresData);
  }

  async deleteCoccionCompleta(id_coccion: number) {
    return await coccionRepository.deleteCoccionCompleta(id_coccion);
  }

  async getOperadoresByCoccion(id_coccion: number) {
    return await coccionRepository.getOperadoresByIdCoccion(id_coccion);
  }

  async findByIdComplete(id_coccion: number) {
    const coccion = await this.findByIdWithRelations(id_coccion);
    if (!coccion) throw new Error('Cocción no encontrada');
    
    const operadores = await this.getOperadoresByCoccion(id_coccion);
    return {
      ...coccion,
      operadores
    };
  }
}

export default new CoccionService();
