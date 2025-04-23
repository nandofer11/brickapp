import RolRepository from "@/lib/repositories/RolRepository";

const rolRepository = new RolRepository();

class RolService {
  async getAll(id_empresa: number) {
    return await rolRepository.getAll(id_empresa);
  }

  async getById(id_rol: number, id_empresa: number) {
    const rol = await rolRepository.getById(id_rol, id_empresa);
    if (!rol) {
      throw new Error("Rol no encontrado");
    }
    return rol;
  }

  async create(data: any) {
    return await rolRepository.createRol(data);
  }

  async update(id_rol: number, id_empresa: number, data: any) {
    return await rolRepository.updateRol(id_rol, id_empresa, data);
  }

  async delete(id_rol: number, id_empresa: number) {
    return await rolRepository.deleteRol(id_rol, id_empresa);
  }
}

export default new RolService();
