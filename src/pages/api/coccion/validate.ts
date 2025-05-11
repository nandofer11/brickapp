import { NextApiRequest, NextApiResponse } from 'next';
import { CoccionRepository } from '@/lib/repositories/CoccionRepository';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { semana_id, horno_id, id_empresa } = req.body;

    const coccionRepo = new CoccionRepository();
    const existeCoccion = await coccionRepo.existeCoccionActivaEnSemanaYHorno(
      semana_id,
      horno_id,
      id_empresa
    );

    if (existeCoccion) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cocción activa para este horno en la semana seleccionada'
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al validar cocción:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error interno al validar cocción'
    });
  }
}
