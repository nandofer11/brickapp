import { prisma } from "@/lib/prisma";
import { BaseRepository } from "./BaseRepository";

class RolRepository extends BaseRepository {
  constructor() {
    // Se pasa el modelo y el nombre del campo ID
    super(prisma.rol, "id_rol");
  }

  // Obtener todos los roles de una empresa
  async getAll(id_empresa: number) {
    return this.findAllByEmpresa(id_empresa);
  }

  // Obtener un rol por ID y empresa
  async getById(id_rol: number, id_empresa: number) {
    return this.findById(id_rol, id_empresa);
  }

  // Crear un nuevo rol
  async createRol(data: any) {
    return this.create(data);
  }

  // Actualizar un rol
  async updateRol(id_rol: number, id_empresa: number, data: any) {
    return this.update(id_rol, id_empresa, data);
  }

  // Eliminar un rol
  async deleteRol(id_rol: number, id_empresa: number) {
    return this.delete(id_rol, id_empresa);
  }

  // (Opcional) Buscar rol por nombre dentro de una empresa
  async findByNombre(nombre: string, id_empresa: number) {
    return this.model.findFirst({
      where: {
        nombre,
        id_empresa,
      },
    });
  }
}

export default RolRepository;
