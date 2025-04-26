import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { username, password } = req.body;

  // Verificar credenciales del usuario
  if (username === 'admin' && password === 'password') {
    const user = { id: 1, username, role: 'admin' }; // Ejemplo de usuario autenticado
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(user, secret, { expiresIn: '1h' });

    return res.status(200).json({ token });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
}
