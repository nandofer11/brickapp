import { HornoRepository } from '@/lib/repositories/HornoRepository';

const hornoRepository = new HornoRepository();

class HornoService {

    async getHornoByIdAndEmpresa(id_horno: number, id_empresa: number) {
        return await hornoRepository.findByIdAndEmpresa(id_horno, id_empresa);
    }

    async getAllHornosByEmpresa(id_empresa: number) {
        return await hornoRepository.findAllByEmpresa(id_empresa);
    }

    async createHorno(data: { prefijo: string; nombre: string; cantidad_humeadores: number; cantidad_quemadores: number }, id_empresa: number) {
        return hornoRepository.createHorno({
            ...data,
            id_empresa, // Agregar id_empresa al crear el horno
        });
    }

    async getHornoById(id_horno: number) {
        return await hornoRepository.findById(id_horno);
    }

    async updateHorno(id_horno: number, id_empresa: number, data: any) {
        return await hornoRepository.updateHorno(id_horno, id_empresa, data);
    }

    async deleteHorno(id_horno: number, id_empresa: number) {
        return await hornoRepository.deleteHorno(id_horno, id_empresa);
    }
}

export default new HornoService();