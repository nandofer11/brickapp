import { CategoriaRepository } from '../repositories/CategoriaRepository';
import { ProductoRepository } from '../repositories/ProductoRepository';
import { Prisma } from '@prisma/client';

export class ProductoService {
    private categoriaRepo: CategoriaRepository;
    private productoRepo: ProductoRepository;

    constructor() {
        this.categoriaRepo = new CategoriaRepository();
        this.productoRepo = new ProductoRepository();
    }

    // Métodos para Categorías
    async getCategorias(id_empresa: number) {
        return this.categoriaRepo.findAllByEmpresa(id_empresa);
    }

    async createCategoria(data: any) {
        return this.categoriaRepo.create(data);
    }

    async updateCategoria(id: number, data: any) {
        return this.categoriaRepo.update(id, data);
    }

    async deleteCategoria(id: number) {
        return this.categoriaRepo.delete(id);
    }

    // Métodos para Productos
    async getProductos(id_empresa: number) {
        return this.productoRepo.findAllByEmpresa(id_empresa);
    }

    async createProducto(data: any) {
        const productoData = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio_unitario: new Prisma.Decimal(data.precio_unitario),
            peso: new Prisma.Decimal(data.peso),
            dimensiones: data.dimensiones,
            estado: Number(data.estado),
            id_empresa: data.id_empresa,
            id_categoria: data.categoria_id_categoria
        };

        return this.productoRepo.create(productoData);
    }

    async updateProducto(id: number, data: any) {
        const updateData = {
            ...data,
            precio_unitario: new Prisma.Decimal(data.precio_unitario),
            peso: new Prisma.Decimal(data.peso),
            estado: Number(data.estado)
        };
        
        return this.productoRepo.update(id, updateData);
    }

    async deleteProducto(id: number) {
        // Soft delete: marcar como eliminado (estado = 0)
        return this.productoRepo.delete(id);
    }
}

export default new ProductoService();
