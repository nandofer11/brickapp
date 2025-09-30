import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import ProductoService from '@/lib/services/ProductoService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const id_empresa = session.user?.id_empresa;
        if (!id_empresa) {
            return res.status(400).json({ message: 'ID de empresa no válido' });
        }

        switch (req.method) {
            case 'GET':
                try {
                    if (req.query.type === 'categorias') {
                        const categorias = await ProductoService.getCategorias(id_empresa);
                        return res.status(200).json(categorias);
                    }
                    const productos = await ProductoService.getProductos(id_empresa);
                    return res.status(200).json(productos);
                } catch (error) {
                    console.error('Error GET:', error);
                    return res.status(500).json({ 
                        message: 'Error al obtener datos',
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }

            case 'POST':
                try {
                    if (req.query.type === 'categoria') {
                        const categoria = await ProductoService.createCategoria({
                            ...req.body,
                            id_empresa
                        });
                        return res.status(201).json(categoria);
                    }

                    const { categoria_id_categoria, nombre, precio_unitario } = req.body;
                    
                    // Solo validar campos obligatorios
                    if (!categoria_id_categoria || !nombre || !precio_unitario) {
                        return res.status(400).json({ message: 'Faltan campos requeridos: categoría, nombre y precio unitario' });
                    }

                    const productoData = {
                        nombre: nombre.trim(),
                        descripcion: req.body.descripcion || null,
                        precio_unitario: Number(precio_unitario),
                        peso: req.body.peso ? Number(req.body.peso) : null, // Opcional
                        dimensiones: req.body.dimensiones ? req.body.dimensiones.trim() : null, // Opcional
                        estado: Number(req.body.estado || 1),
                        categoria_id_categoria: Number(categoria_id_categoria),
                        id_empresa
                    };

                    const producto = await ProductoService.createProducto(productoData);
                    return res.status(201).json(producto);
                } catch (error) {
                    console.error('Error al crear producto:', error);
                    return res.status(500).json({ 
                        message: error instanceof Error ? error.message : 'Error al crear producto',
                        details: error instanceof Error ? error.stack : 'Error desconocido'
                    });
                }

            case 'PUT':
                try {
                    if (req.query.type === 'categoria') {
                        const { id_categoria, ...data } = req.body;
                        if (!id_categoria) {
                            return res.status(400).json({ message: 'ID de categoría no proporcionado' });
                        }
                        if (!data.nombre?.trim()) {
                            return res.status(400).json({ message: 'El nombre es requerido' });
                        }
                        const categoria = await ProductoService.updateCategoria(id_categoria, data);
                        return res.status(200).json(categoria);
                    }

                    const { id_producto, ...data } = req.body;
                    if (!id_producto) {
                        return res.status(400).json({ message: 'ID de producto no proporcionado' });
                    }
                    const producto = await ProductoService.updateProducto(id_producto, data);
                    return res.status(200).json(producto);
                } catch (error) {
                    console.error('Error PUT:', error);
                    return res.status(500).json({ 
                        message: 'Error al actualizar registro',
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }

            case 'DELETE':
                try {
                    const id = Number(req.query.id);
                    if (!id || isNaN(id)) {
                        return res.status(400).json({ message: 'ID no válido' });
                    }

                    if (req.query.type === 'categoria') {
                        await ProductoService.deleteCategoria(id);
                        return res.status(200).json({ message: 'Categoría eliminada' });
                    }
                    await ProductoService.deleteProducto(id);
                    return res.status(200).json({ message: 'Producto eliminado correctamente' });
                } catch (error) {
                    console.error('Error DELETE:', error);
                    return res.status(500).json({ 
                        message: 'Error al eliminar registro',
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
