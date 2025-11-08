import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { ProveedorService } from '@/lib/services/ProveedorService';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar autenticación
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const proveedorService = new ProveedorService(prisma);

    switch (req.method) {
      case 'GET':
        await handleGet(req, res, proveedorService);
        break;
      case 'POST':
        await handlePost(req, res, proveedorService);
        break;
      case 'PUT':
        await handlePut(req, res, proveedorService);
        break;
      case 'DELETE':
        await handleDelete(req, res, proveedorService);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error('Error en API de proveedores:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, proveedorService: ProveedorService) {
  const { id, search, tipo_documento, page = '1', limit = '10', stats } = req.query;

  // Si se solicita un proveedor específico por ID
  if (id) {
    const proveedor = await proveedorService.getProveedorById(parseInt(id as string));
    return res.status(200).json(proveedor);
  }

  // Si se solicitan estadísticas
  if (stats === 'true') {
    const estadisticas = await proveedorService.getProveedorStats();
    return res.status(200).json(estadisticas);
  }

  // Obtener lista de proveedores con filtros
  const filters = {
    search: search as string,
    tipo_documento: tipo_documento as string,
  };

  const result = await proveedorService.getProveedores(
    filters,
    parseInt(page as string),
    parseInt(limit as string)
  );

  res.status(200).json(result);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, proveedorService: ProveedorService) {
  const {
    tipo_documento,
    nro_documento,
    nombre,
    ciudad,
    telefono,
    celular,
    email,
  } = req.body;

  // Validar campos requeridos
  if (!nombre) {
    return res.status(400).json({ 
      message: 'El campo nombre es obligatorio' 
    });
  }

  const proveedor = await proveedorService.createProveedor({
    tipo_documento: tipo_documento || undefined,
    nro_documento: nro_documento || undefined,
    nombre,
    ciudad: ciudad || undefined,
    telefono: telefono || undefined,
    celular: celular || undefined,
    email: email || undefined,
  });

  res.status(201).json({
    message: 'Proveedor creado exitosamente',
    proveedor,
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, proveedorService: ProveedorService) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID del proveedor es requerido' });
  }

  const {
    tipo_documento,
    nro_documento,
    nombre,
    ciudad,
    telefono,
    celular,
    email,
  } = req.body;

  const proveedor = await proveedorService.updateProveedor(parseInt(id as string), {
    tipo_documento,
    nro_documento,
    nombre,
    ciudad,
    telefono,
    celular,
    email,
  });

  res.status(200).json({
    message: 'Proveedor actualizado exitosamente',
    proveedor,
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, proveedorService: ProveedorService) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'ID del proveedor es requerido' });
  }

  await proveedorService.deleteProveedor(parseInt(id as string));

  res.status(200).json({
    message: 'Proveedor eliminado exitosamente',
  });
}