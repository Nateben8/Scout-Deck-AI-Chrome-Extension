import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';

export default async function me(_req, res) {
  try {
    const auth = _req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ error: 'not_found' });

    return res.status(200).json({ id: user.id, email: user.email, name: user.name, picture: user.picture });
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
} 