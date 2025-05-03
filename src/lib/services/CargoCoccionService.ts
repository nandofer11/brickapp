import { CargoCoccionRepository } from '../repositories/CargoCoccionRepository';

const cargoCoccionRepository = new CargoCoccionRepository();

export class CargoCoccionService {

    async findAllByEmpresa(id_empresa: number) {
        return await cargoCoccionRepository.findAllByEmpresa(id_empresa);
    }

    async findById(id_cargo_coccion: number) {
        return await cargoCoccionRepository.findById(id_cargo_coccion);
    }

    async createCargoCoccion(data: { nombre_cargo: string; costo_cargo: number; id_empresa: number; id_horno: number }) {
        return await cargoCoccionRepository.createCargoCoccion(data);
    }

    async updateCargoCoccion(id_cargo_coccion: number, nombre_cargo?: string, costo_cargo?: number, id_horno?: number) {
        return await cargoCoccionRepository.updateCargoCoccion(id_cargo_coccion, { nombre_cargo, costo_cargo, id_horno });
    }

    async delete(id_cargo_coccion: number, id_empresa: number) {
        return await cargoCoccionRepository.delete(id_cargo_coccion, id_empresa);
    }
}

export default new CargoCoccionService();
