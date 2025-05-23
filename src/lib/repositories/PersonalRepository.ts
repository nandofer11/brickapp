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

    async findByDniAndEmpresa(dni: string, id_empresa: number) {
        return prisma.personal.findFirst({
            where: {
                dni,
                id_empresa,
            },
        });
    }

    async createPersonal(data: any) {
        console.log("Datos enviados a Prisma:", data);

        // Convertir campos de tipo DateTime a objetos Date
        if (data.fecha_nacimiento) {
            data.fecha_nacimiento = new Date(data.fecha_nacimiento);
        }
        if (data.fecha_ingreso) {
            data.fecha_ingreso = new Date(data.fecha_ingreso);
        }

        return prisma.personal.create({ data });
    }

    async updatePersonal(id_personal: number, id_empresa: number, data: any) {
        return this.update(id_personal, id_empresa, data);
    }

    async deletePersonal(id_personal: number, id_empresa: number) {
        return await prisma.personal.deleteMany({
          where: {
            id_personal,
            id_empresa,
          },
        });
      }
}

export default PersonalRepository;
