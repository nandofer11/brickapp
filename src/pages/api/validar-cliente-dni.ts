import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { dni } = req.body;

    if (!dni || dni.length !== 8) {
      return res.status(400).json({ success: false, message: 'El DNI debe tener 8 dígitos.' });
    }

    // Configurar la URL y los headers con el token
    const url = `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.RENIEC_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'No se pudo validar el DNI con RENIEC.' });
    }

    const data = await response.json();

    if (!data.nombres) {
      return res.status(400).json({ success: false, message: 'DNI no encontrado.' });
    }

    return res.status(200).json({ 
      success: true,
      nombres: data.nombres,
      apellidoPaterno: data.apellidoPaterno,
      apellidoMaterno: data.apellidoMaterno
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
}
