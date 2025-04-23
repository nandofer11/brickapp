import { usuarioRepository } from "@/lib/repositories/UsuarioRepository";

class UsuarioService {
  // Obtener todos los usuarios de una empresa
  async getAllUsuarios(id_empresa: number) {
    return usuarioRepository.getAll(id_empresa);
  }

  // Obtener un solo usuario por ID y empresa
  async getUsuarioById(id_usuario: number, id_empresa: number) {
    return usuarioRepository.getById(id_usuario, id_empresa);
  }

  // Crear un nuevo usuario
  async createUsuario(data: any) {
    return usuarioRepository.create(data);
  }

  // Actualizar usuario por ID y empresa
  async updateUsuario(id_usuario: number, id_empresa: number, data: any) {
    return usuarioRepository.update(id_usuario, id_empresa, data);
  }

  // Eliminar usuario por ID y empresa
  async deleteUsuario(id_usuario: number, id_empresa: number) {
    return usuarioRepository.delete(id_usuario, id_empresa);
  }

  // Buscar usuario por nombre de usuario y empresa (útil para login o validaciones)
  async getUsuarioByUsername(usuario: string, id_empresa: number) {
    return usuarioRepository.findByUsername(usuario, id_empresa);
  }
}

export const usuarioService = new UsuarioService();
