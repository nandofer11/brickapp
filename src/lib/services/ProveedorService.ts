import { PrismaClient } from '@prisma/client';
import { ProveedorRepository, CreateProveedorData, UpdateProveedorData, ProveedorFilters } from '../repositories/ProveedorRepository';

export class ProveedorService {
  private proveedorRepository: ProveedorRepository;

  constructor(prisma: PrismaClient) {
    this.proveedorRepository = new ProveedorRepository(prisma);
  }

  async createProveedor(data: CreateProveedorData) {
    // Validaciones
    if (!data.nombre || data.nombre.trim() === '') {
      throw new Error('El nombre del proveedor es obligatorio');
    }

    // Validar documento si se proporciona
    if (data.nro_documento && data.tipo_documento) {
      // Validar formato según tipo de documento
      if (data.tipo_documento === 'DNI' && data.nro_documento.length !== 8) {
        throw new Error('El DNI debe tener 8 dígitos');
      }

      if (data.tipo_documento === 'RUC' && data.nro_documento.length !== 11) {
        throw new Error('El RUC debe tener 11 dígitos');
      }

      // Verificar que no exista el documento
      const existingDocument = await this.proveedorRepository.checkDocumentExists(data.nro_documento);
      if (existingDocument) {
        throw new Error('Ya existe un proveedor con este número de documento');
      }
    }

    // Validar que si se proporciona nro_documento, también se proporcione tipo_documento
    if (data.nro_documento && !data.tipo_documento) {
      throw new Error('Si proporciona un número de documento, debe especificar el tipo de documento');
    }

    // Validar celular si se proporciona
    if (data.celular && (data.celular.length !== 9 || !/^\d+$/.test(data.celular))) {
      throw new Error('El celular debe tener 9 dígitos');
    }

    // Validar email si se proporciona
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('El formato del email no es válido');
    }

    return await this.proveedorRepository.create(data);
  }

  async getProveedores(filters?: ProveedorFilters, page = 1, limit = 10) {
    return await this.proveedorRepository.findAll(filters, page, limit);
  }

  async getProveedorById(id: number) {
    const proveedor = await this.proveedorRepository.findById(id);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }
    return proveedor;
  }

  async updateProveedor(id: number, data: UpdateProveedorData) {
    // Verificar que el proveedor existe
    const existingProveedor = await this.proveedorRepository.findById(id);
    if (!existingProveedor) {
      throw new Error('Proveedor no encontrado');
    }

    // Validaciones
    if (data.nombre !== undefined && (!data.nombre || data.nombre.trim() === '')) {
      throw new Error('El nombre del proveedor es obligatorio');
    }

    // Validar documento si se actualiza
    if (data.nro_documento !== undefined && data.nro_documento !== null) {
      if (data.tipo_documento === 'DNI' && data.nro_documento.length !== 8) {
        throw new Error('El DNI debe tener 8 dígitos');
      }

      if (data.tipo_documento === 'RUC' && data.nro_documento.length !== 11) {
        throw new Error('El RUC debe tener 11 dígitos');
      }

      // Verificar que no exista el documento (excluyendo el proveedor actual)
      const existingDocument = await this.proveedorRepository.checkDocumentExists(data.nro_documento, id);
      if (existingDocument) {
        throw new Error('Ya existe otro proveedor con este número de documento');
      }
    }

    // Validar celular si se proporciona
    if (data.celular && (data.celular.length !== 9 || !/^\d+$/.test(data.celular))) {
      throw new Error('El celular debe tener 9 dígitos');
    }

    // Validar email si se proporciona
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('El formato del email no es válido');
    }

    return await this.proveedorRepository.update(id, data);
  }

  async deleteProveedor(id: number) {
    // Verificar que el proveedor existe
    const existingProveedor = await this.proveedorRepository.findById(id);
    if (!existingProveedor) {
      throw new Error('Proveedor no encontrado');
    }

    // TODO: Verificar si el proveedor tiene compras asociadas
    // Si tiene compras, no permitir eliminar o manejar la lógica de negocio

    return await this.proveedorRepository.delete(id);
  }

  async getProveedorStats() {
    return await this.proveedorRepository.getStats();
  }

  async validateDocument(tipo_documento: string, nro_documento: string, excludeId?: number) {
    if (tipo_documento === 'DNI' && nro_documento.length !== 8) {
      throw new Error('El DNI debe tener 8 dígitos');
    }

    if (tipo_documento === 'RUC' && nro_documento.length !== 11) {
      throw new Error('El RUC debe tener 11 dígitos');
    }

    const exists = await this.proveedorRepository.checkDocumentExists(nro_documento, excludeId);
    if (exists) {
      throw new Error('Ya existe un proveedor con este número de documento');
    }

    return true;
  }
}