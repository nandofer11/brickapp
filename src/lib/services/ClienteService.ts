import { ClienteRepository } from '../repositories/ClienteRepository';

export class ClienteService {
    private clienteRepo: ClienteRepository;

    constructor() {
        this.clienteRepo = new ClienteRepository();
    }

    async getClientes(id_empresa: number) {
        return this.clienteRepo.findAllByEmpresa(id_empresa);
    }

    async createCliente(data: any) {
        return this.clienteRepo.create(data);
    }

    async updateCliente(id: number, data: any) {
        return this.clienteRepo.update(id, data);
    }

    async deleteCliente(id: number) {
        return this.clienteRepo.delete(id);
    }
}

export default new ClienteService();
