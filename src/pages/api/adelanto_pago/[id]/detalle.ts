import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { AdelantoPagoService } from '@/lib/services/AdelantoPagoService';
import { Prisma } from '@prisma/client';

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

    // Manejar diferentes métodos HTTP
    switch (req.method) {
      // GET para obtener detalles de pagos parciales
      case 'GET':
        const detalles = await adelantoPagoService.getDetalles(adelantoId);
        // Obtener también el saldo actual
        const saldo = await adelantoPagoService.getSaldo(adelantoId);
        return res.status(200).json({ detalles, saldo });

      // POST para agregar un nuevo pago parcial
      case 'POST':
        const data = req.body;
        
        // Validar datos requeridos
        if (!data.fecha || !data.monto_pagado || !data.id_semana_laboral) {
          return res.status(400).json({ message: 'Datos incompletos. Se requiere fecha, monto_pagado y id_semana_laboral' });
        }

        // Validar que el monto pagado sea positivo
        if (Number(data.monto_pagado) <= 0) {
          return res.status(400).json({ message: 'El monto pagado debe ser mayor a 0' });
        }

        // Obtener el saldo actual para validar que no se sobrepase
        const saldoActual = await adelantoPagoService.getSaldo(adelantoId);
        if (!saldoActual) {
          return res.status(404).json({ message: 'No se pudo obtener el saldo del adelanto' });
        }

        // Validar que el monto pagado no sea mayor al saldo pendiente
        if (Number(data.monto_pagado) > saldoActual.saldo) {
          return res.status(400).json({ 
            message: 'El monto pagado no puede ser mayor al saldo pendiente', 
            saldo_pendiente: saldoActual.saldo 
          });
        }

        // Preparar los datos para crear el detalle
        const createData: Prisma.adelanto_pago_detalleCreateInput = {
          fecha: new Date(data.fecha),
          monto_pagado: new Prisma.Decimal(data.monto_pagado),
          observacion: data.observacion || null,
          semana_laboral: {
            connect: { id_semana_laboral: Number(data.id_semana_laboral) }
          },
          adelanto_pago: {
            connect: { id_adelanto_pago: adelantoId }
          }
        };

        // Crear el detalle de pago
        const nuevoDetalle = await adelantoPagoService.addDetalle(adelantoId, createData);

        // Verificar si con este pago se completa el adelanto
        const nuevoSaldo = await adelantoPagoService.getSaldo(adelantoId);
        
        // Si el saldo queda en 0, actualizar el estado del adelanto a "Cancelado"
        if (nuevoSaldo && nuevoSaldo.saldo === 0) {
          await adelantoPagoService.updateAdelanto(adelantoId, { 
            estado: "Cancelado",
            comentario: data.comentario || "Cancelado por pago completo"
          });
        }

        return res.status(201).json({
          detalle: nuevoDetalle,
          saldo: nuevoSaldo,
          message: nuevoSaldo && nuevoSaldo.saldo === 0 
            ? 'Pago registrado. Adelanto completamente cancelado.' 
            : 'Pago parcial registrado correctamente.'
        });

      default:
        return res.status(405).json({ message: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en la API de detalles de adelanto:', error);
    return res.status(500).json({ 
      message: 'Error al procesar la solicitud', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
}
