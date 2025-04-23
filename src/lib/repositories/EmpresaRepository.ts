import { prisma } from "@/lib/prisma";
import { BaseRepository } from "./BaseRepository";

class EmpresaRepository extends BaseRepository {
  constructor() {
    super(prisma.empresa, "id_empresa");
  }

  // Obtener todas las empresas
  async getAll() {
    return this.model.findMany({
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre_completo: true,
            email: true,
          },
        },
      },
    });
  }

  // Obtener una empresa por ID
  async getById(id_empresa: number) {
    return this.model.findUnique({
      where: { id_empresa },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre_completo: true,
            email: true,
            id_rol: true,
          },
        },
      },
    });
  }

  // Crear una nueva empresa
  async create(data: any) {
    return this.model.create({
      data,
    });
  }

  // Actualizar una empresa por ID
  async update(id_empresa: number, data: any) {
    return this.model.update({
      where: { id_empresa },
      data,
    });
  }

  // Eliminar una empresa por ID
  async delete(id_empresa: number) {
    // Primero verificamos que no tenga usuarios asociados o eliminamos los usuarios
    return this.model.delete({
      where: { id_empresa },
    });
  }

  // Buscar empresa por RFC
  async findByRFC(rfc: string) {
    return this.model.findFirst({
      where: { rfc },
    });
  }

  // Buscar empresa por razón social
  async findByRazonSocial(razon_social: string) {
    return this.model.findFirst({
      where: { razon_social },
    });
  }

  // Verificar si una empresa existe
  async exists(id_empresa: number) {
    const count = await this.model.count({
      where: { id_empresa },
    });
    return count > 0;
  }

  // Obtener estadísticas de la empresa (cantidad de usuarios, etc)
  async getStats(id_empresa: number) {
    const usuariosCount = await prisma.usuario.count({
      where: { id_empresa },
    });

    return {
      usuarios: usuariosCount,
    };
  }
}

export const empresaRepository = new EmpresaRepository(); 