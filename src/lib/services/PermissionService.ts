import { prisma } from '@/lib/prisma';
import { permiso, rol, rol_permiso, usuario, empresa } from '@prisma/client';

export interface PermisoWithRoles extends permiso {
  rol_permiso: rol_permiso[];
}

export interface RoleWithPermissions extends rol {
  rol_permiso: (rol_permiso & {
    permiso: permiso;
  })[];
}

export interface UsuarioWithRoleAndPermissions extends usuario {
  rol?: RoleWithPermissions;
  empresa?: empresa;
}

export class PermissionService {
  // Obtener todos los permisos
  static async getAllPermissions(): Promise<permiso[]> {
    return await prisma.permiso.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  // Obtener permisos con sus roles asignados
  static async getPermissionsWithRoles(): Promise<PermisoWithRoles[]> {
    return await prisma.permiso.findMany({
      include: {
        rol_permiso: {
          include: {
            rol: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  // Obtener todos los roles con sus permisos
  static async getRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    return await prisma.rol.findMany({
      include: {
        rol_permiso: {
          include: {
            permiso: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  // Obtener un rol específico con sus permisos
  static async getRoleWithPermissions(rolId: number): Promise<RoleWithPermissions | null> {
    return await prisma.rol.findUnique({
      where: { id_rol: rolId },
      include: {
        rol_permiso: {
          include: {
            permiso: true
          }
        }
      }
    });
  }

  // Obtener permisos de un usuario específico
  static async getUserPermissions(userId: number): Promise<permiso[]> {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: {
        rol: {
          include: {
            rol_permiso: {
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.rol) {
      return [];
    }

    return usuario.rol.rol_permiso.map(rp => rp.permiso);
  }

  // Asignar permiso a rol
  static async assignPermissionToRole(rolId: number, permisoId: number): Promise<rol_permiso> {
    // Verificar si la asignación ya existe
    const existing = await prisma.rol_permiso.findUnique({
      where: {
        id_rol_id_permiso: {
          id_rol: rolId,
          id_permiso: permisoId
        }
      }
    });

    if (existing) {
      throw new Error('El permiso ya está asignado a este rol');
    }

    return await prisma.rol_permiso.create({
      data: {
        id_rol: rolId,
        id_permiso: permisoId,
        activo: 1
      }
    });
  }

  // Desasignar permiso de rol
  static async removePermissionFromRole(rolId: number, permisoId: number): Promise<void> {
    await prisma.rol_permiso.delete({
      where: {
        id_rol_id_permiso: {
          id_rol: rolId,
          id_permiso: permisoId
        }
      }
    });
  }

  // Asignar múltiples permisos a un rol (reemplazar permisos existentes)
  static async setRolePermissions(rolId: number, permisoIds: number[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Eliminar permisos existentes
      await tx.rol_permiso.deleteMany({
        where: { id_rol: rolId }
      });

      // Asignar nuevos permisos
      if (permisoIds.length > 0) {
        await tx.rol_permiso.createMany({
          data: permisoIds.map(permisoId => ({
            id_rol: rolId,
            id_permiso: permisoId,
            activo: 1
          }))
        });
      }
    });
  }

  // Verificar si un usuario tiene un permiso específico
  static async userHasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: {
        rol: {
          include: {
            rol_permiso: {
              where: { activo: 1 },
              include: {
                permiso: true
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.rol) {
      return false;
    }

    return usuario.rol.rol_permiso.some(rp => rp.permiso.codigo === permissionCode);
  }

  // Crear un nuevo permiso
  static async createPermission(nombre: string, codigo: string, descripcion?: string, categoria?: string): Promise<permiso> {
    return await prisma.permiso.create({
      data: {
        nombre,
        codigo,
        descripcion,
        categoria: categoria || 'General'
      }
    });
  }

  // Actualizar un permiso
  static async updatePermission(id: number, data: { nombre?: string; codigo?: string; descripcion?: string; categoria?: string }): Promise<permiso> {
    return await prisma.permiso.update({
      where: { id_permiso: id },
      data
    });
  }

  // Eliminar un permiso
  static async deletePermission(id: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Eliminar relaciones rol-permiso
      await tx.rol_permiso.deleteMany({
        where: { id_permiso: id }
      });

      // Eliminar el permiso
      await tx.permiso.delete({
        where: { id_permiso: id }
      });
    });
  }

  // Obtener usuario completo con rol y permisos
  static async getUserWithPermissions(userId: number): Promise<UsuarioWithRoleAndPermissions | null> {
    return await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: {
        rol: {
          include: {
            rol_permiso: {
              where: { activo: 1 },
              include: {
                permiso: true
              }
            }
          }
        },
        empresa: true
      }
    });
  }

  // Obtener permisos agrupados por categoría
  static async getPermissionsByCategory(): Promise<Record<string, permiso[]>> {
    const permissions = await this.getAllPermissions();
    const categories: Record<string, permiso[]> = {};

    permissions.forEach(permission => {
      const category = permission.categoria || 'General';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(permission);
    });

    return categories;
  }

  // Obtener todos los roles (sin permisos)
  static async getAllRoles(): Promise<rol[]> {
    return await prisma.rol.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  // Crear un nuevo rol
  static async createRole(nombre: string, descripcion: string, idEmpresa: number): Promise<rol> {
    return await prisma.rol.create({
      data: {
        nombre,
        descripcion,
        id_empresa: idEmpresa
      }
    });
  }

  // Actualizar un rol
  static async updateRole(id: number, data: { nombre?: string; descripcion?: string }): Promise<rol> {
    return await prisma.rol.update({
      where: { id_rol: id },
      data
    });
  }

  // Eliminar un rol
  static async deleteRole(id: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Verificar si hay usuarios asignados a este rol
      const usuariosCount = await tx.usuario.count({
        where: { id_rol: id }
      });

      if (usuariosCount > 0) {
        throw new Error('No se puede eliminar el rol porque tiene usuarios asignados');
      }

      // Eliminar relaciones rol-permiso
      await tx.rol_permiso.deleteMany({
        where: { id_rol: id }
      });

      // Eliminar el rol
      await tx.rol.delete({
        where: { id_rol: id }
      });
    });
  }
}