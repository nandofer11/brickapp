import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('Datos recibidos:', req.body);
    const { dni, id_empresa } = req.body;

    // Validar que el DNI tenga 8 dígitos
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ message: 'El DNI debe tener 8 dígitos.' });
    }

    if (!id_empresa) {
      return res.status(400).json({ message: 'El ID de la empresa es obligatorio.' });
    }

    // Verificar si el DNI ya está registrado en la misma empresa
    const personalExistente = await prisma.personal.findFirst({
      where: {
        dni,
        id_empresa
      }
    });

    if (personalExistente) {
      return res.status(400).json({ message: 'El DNI ya está registrado en la base de datos para esta empresa.' });
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
      const errorMessage = await response.text();
      console.error('Error en la API externa:', errorMessage);
      return res.status(400).json({ message: 'No se pudo validar el DNI con RENIEC.' });
    }

    const data = await response.json();
    console.log('Respuesta de la API externa:', data);

    if (!data.nombres || !data.apellidoPaterno) {
      return res.status(400).json({ message: 'DNI no válido o sin información.' });
    }

    return res.status(200).json({ 
      nombres: data.nombres,
      apellido_paterno: data.apellidoPaterno,
      apellido_materno: data.apellidoMaterno
    });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    await prisma.$disconnect();
  }
}
