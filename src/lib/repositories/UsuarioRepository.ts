import { prisma } from "@/lib/prisma";
import { BaseRepository } from "./BaseRepository";

class UsuarioRepository extends BaseRepository {
  constructor() {
    super(prisma.usuario, "id_usuario");
  }

  // Obtener todos los usuarios por empresa
  async getAll(id_empresa: number) {
    return this.model.findMany({
      where: { id_empresa },
      include: {
        rol: true,
        empresa: true,
      },
    });
  }

  // Obtener un usuario por ID y empresa
  async getById(id_usuario: number, id_empresa: number) {
    return this.model.findFirst({
      where: { id_usuario, id_empresa },
      include: {
        rol: true,
        empresa: true,
      },
    });
  }

  // Crear un nuevo usuario
  async create(data: any) {
    return this.model.create({
      data,
    });
  }

  // Actualizar un usuario por ID y empresa
  async update(id_usuario: number, id_empresa: number, data: any) {
    return this.model.updateMany({
      where: { id_usuario, id_empresa },
      data,
    });
  }

  // Eliminar un usuario por ID y empresa
  async delete(id_usuario: number, id_empresa: number) {
    return this.model.deleteMany({
      where: { id_usuario, id_empresa },
    });
  }

  // Obtener usuario por username (útil para login)
  async findByUsername(usuario: string, id_empresa: number) {
    return this.model.findFirst({
      where: { usuario, id_empresa },
    });
  }
}

export const usuarioRepository = new UsuarioRepository();
