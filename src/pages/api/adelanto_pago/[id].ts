import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { AdelantoPagoService } from '@/lib/services/AdelantoPagoService';

const adelantoPagoService = new AdelantoPagoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const adelantoId = Number(id);

  if (isNaN(adelantoId)) {
    return res.status(400).json({ message: 'ID de adelanto inválido' });
  }

  try {
    // Verificar la autenticación y obtener la sesión del usuario
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Obtener el ID de empresa del usuario autenticado
    const id_empresa = session.user?.id_empresa;
    if (!id_empresa) {
      return res.status(400).json({ message: 'ID de empresa no válido' });
    }

    // Verificar que el adelanto existe
    const adelanto = await adelantoPagoService.findById(adelantoId);
    if (!adelanto) {
      return res.status(404).json({ message: 'Adelanto no encontrado' });
    }

    // Verificar que el adelanto pertenece a la empresa del usuario
    if (adelanto.personal?.id_empresa !== id_empresa) {
      return res.status(403).json({ message: 'No tiene acceso a este adelanto' });
    }

    switch (req.method) {
      case 'GET':
        // Obtener el saldo actual
        const saldo = await adelantoPagoService.getSaldo(adelantoId);
        return res.status(200).json({ ...adelanto, saldo });
        
      case 'PUT':
        const data = req.body;
        
        // Verificar si el usuario tiene rol de administrador para ciertas operaciones
        const rol = session.user?.rol;
        const esAdmin = rol === 'ADMINISTRADOR';
        
        // Si está intentando cambiar el estado a "Anulado", verificar si es administrador
        if (data.estado === 'Anulado' && !esAdmin) {
          return res.status(403).json({ 
            message: 'Solo los administradores pueden anular adelantos' 
          });
        }
        
        // Actualizar el adelanto
        const adelantoActualizado = await adelantoPagoService.updateAdelanto(adelantoId, data);
        return res.status(200).json({
          adelanto: adelantoActualizado,
          message: 'Adelanto actualizado correctamente'
        });
        
      case 'DELETE':
        // Solo administradores pueden eliminar adelantos
        if (session.user?.rol !== 'ADMINISTRADOR') {
          return res.status(403).json({ 
            message: 'Solo los administradores pueden eliminar adelantos' 
          });
        }
        
        // Verificar si tiene detalles antes de eliminar
        const detalles = await adelantoPagoService.getDetalles(adelantoId);
        if (detalles && detalles.length > 0) {
          return res.status(400).json({
            message: 'No se puede eliminar un adelanto que tiene pagos registrados'
          });
        }
        
        // Eliminar el adelanto
        await adelantoPagoService.deleteAdelanto(adelantoId);
        return res.status(200).json({ message: 'Adelanto eliminado correctamente' });
        
      default:
        return res.status(405).json({ message: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en la API de adelanto:', error);
    return res.status(500).json({
      message: 'Error al procesar la solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
