import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { ruc } = req.body;

    if (!ruc || ruc.length !== 11) {
      return res.status(400).json({ success: false, message: 'El RUC debe tener 11 dígitos.' });
    }

    // Configurar la URL y los headers con el token
    const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SUNAT_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'No se pudo validar el RUC con SUNAT.' });
    }

    const data = await response.json();

    if (!data.razonSocial) {
      return res.status(400).json({ success: false, message: 'RUC no encontrado.' });
    }

    return res.status(200).json({ 
      success: true,
      razonSocial: data.razonSocial,
      direccion: data.direccion
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
}
