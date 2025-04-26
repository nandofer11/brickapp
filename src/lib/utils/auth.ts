import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

export function validateToken(req: NextApiRequest) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  const secret = process.env.JWT_SECRET || 'default_secret';

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}
