import { prisma } from "@/lib/prisma";
import { BaseRepository } from "./BaseRepository";

class PersonalRepository extends BaseRepository {
    constructor() {
        super(prisma.personal, "id_personal"); // Se pasa el modelo y el nombre del campo ID
    }

    // Obtener todos los registros de personal de una empresa
    async getAllByEmpresa(id_empresa: number) {
        return this.findAllByEmpresa(id_empresa);
    }

    // async findByDni(dni: string) {
    //     return prisma.personal.findUnique({ where: { dni } });
    // }

    async createPersonal(data: any) {
        return this.create({ data });
    }

    // async updatePersonal(id_personal: number, data: Partial<Personal>): Promise<Personal> {
    //     return prisma.personal.update({ where: { id_personal }, data });
    // }

    // async deletePersonal(id_personal: number): Promise<Personal> {
    //     return prisma.personal.delete({ where: { id_personal } });
    // }
}

export default PersonalRepository;
