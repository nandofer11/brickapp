import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { AdelantoPagoService } from '@/lib/services/AdelantoPagoService';

const adelantoPagoService = new AdelantoPagoService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, detalleId } = req.query;
  const adelantoId = Number(id);
  const idDetalle = Number(detalleId);

  if (isNaN(adelantoId) || isNaN(idDetalle)) {
    return res.status(400).json({ message: 'IDs inválidos' });
  }

  try {
    // Verificar la autenticación y obtener la sesión del usuario
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Obtener el ID de empresa y rol del usuario autenticado
    const id_empresa = session.user?.id_empresa;
    const rol = session.user?.rol;

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

    // Verificar que el detalle existe y pertenece al adelanto
    const detalle = await prisma.adelanto_pago_detalle.findFirst({
      where: {
        id_adelanto_pago_detalle: idDetalle,
        id_adelanto_pago: adelantoId
      }
    });

    if (!detalle) {
      return res.status(404).json({ message: 'Detalle de pago no encontrado o no pertenece a este adelanto' });
    }

    switch (req.method) {
      // GET para obtener un detalle específico
      case 'GET':
        return res.status(200).json(detalle);

      // DELETE para eliminar un detalle (solo con rol de ADMINISTRADOR)
      case 'DELETE':
        // Verificar si el usuario tiene rol de administrador
        if (rol !== 'ADMINISTRADOR') {
          return res.status(403).json({ 
            message: 'Permiso denegado. Solo administradores pueden eliminar detalles de pagos' 
          });
        }
        
        // Eliminar el detalle
        await prisma.adelanto_pago_detalle.delete({
          where: { id_adelanto_pago_detalle: idDetalle }
        });

        // Recalcular el saldo y actualizar el estado del adelanto si es necesario
        const saldoActualizado = await adelantoPagoService.getSaldo(adelantoId);
        
        // Si después de eliminar el pago, el saldo ya no es 0, actualizar el estado a "Pendiente"
        if (saldoActualizado && saldoActualizado.saldo > 0 && adelanto.estado === "Cancelado") {
          await adelantoPagoService.updateAdelanto(adelantoId, { 
            estado: "Pendiente",
            comentario: adelanto.comentario 
              ? `${adelanto.comentario} - Revertido a Pendiente por eliminación de pago` 
              : "Revertido a Pendiente por eliminación de pago"
          });
        }

        // Registrar la acción en el log o auditoría
        console.log(`Usuario ${session.user?.name} (${session.user?.id}) eliminó el detalle de pago ${idDetalle} del adelanto ${adelantoId}`);

        return res.status(200).json({ 
          message: 'Detalle de pago eliminado correctamente',
          saldo: saldoActualizado
        });

      default:
        return res.status(405).json({ message: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en la API de detalle específico:', error);
    return res.status(500).json({ 
      message: 'Error al procesar la solicitud', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
}
