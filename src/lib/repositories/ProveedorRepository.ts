import { PrismaClient } from '@prisma/client';

export interface CreateProveedorData {
  tipo_documento?: string;
  nro_documento?: string;
  nombre: string;
  ciudad?: string;
  telefono?: string;
  celular?: string;
  email?: string;
}

export interface UpdateProveedorData {
  tipo_documento?: string;
  nro_documento?: string;
  nombre?: string;
  ciudad?: string;
  telefono?: string;
  celular?: string;
  email?: string;
}

export interface ProveedorFilters {
  search?: string;
  tipo_documento?: string;
}

export class ProveedorRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateProveedorData) {
    return await this.prisma.proveedor.create({
      data: {
        ...(data.tipo_documento && { tipo_documento: data.tipo_documento }),
        ...(data.nro_documento && { nro_documento: data.nro_documento }),
        nombre: data.nombre,
        ...(data.ciudad && { ciudad: data.ciudad }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(data.celular && { celular: data.celular }),
        ...(data.email && { email: data.email }),
      },
    });
  }

  async findAll(filters?: ProveedorFilters, page = 1, limit = 10) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { nro_documento: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tipo_documento) {
      where.tipo_documento = filters.tipo_documento;
    }

    const skip = (page - 1) * limit;

    const [proveedores, total] = await Promise.all([
      this.prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.proveedor.count({ where }),
    ]);

    return {
      proveedores,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async findById(id: number) {
    return await this.prisma.proveedor.findUnique({
      where: { id_proveedor: id },
    });
  }

  async findByDocument(nro_documento: string) {
    return await this.prisma.proveedor.findUnique({
      where: { nro_documento },
    });
  }

  async update(id: number, data: UpdateProveedorData) {
    return await this.prisma.proveedor.update({
      where: { id_proveedor: id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: number) {
    return await this.prisma.proveedor.delete({
      where: { id_proveedor: id },
    });
  }

  async checkDocumentExists(nro_documento: string, excludeId?: number) {
    const where: any = { nro_documento };
    
    if (excludeId) {
      where.id_proveedor = { not: excludeId };
    }

    const existing = await this.prisma.proveedor.findFirst({ where });
    return !!existing;
  }

  async getStats() {
    const total = await this.prisma.proveedor.count();
    const porTipo = await this.prisma.proveedor.groupBy({
      by: ['tipo_documento'],
      _count: true,
    });

    return {
      total,
      porTipo: porTipo.map(item => ({
        tipo: item.tipo_documento,
        cantidad: item._count,
      })),
    };
  }
}