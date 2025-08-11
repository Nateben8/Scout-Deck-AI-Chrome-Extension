import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';

export default async function upsertPlay(req, res) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub;

    const { gameId, playNumber, filmSide, fields } = await req.json();
    if (!gameId || !Number.isFinite(playNumber)) return res.status(400).json({ error: 'missing_fields' });

    const body = {
      userId,
      gameId,
      playNumber: Number(playNumber),
      filmSide: filmSide === 'Defense' ? 'Defense' : 'Offense',
      fields: fields || {},
    };

    const result = await prisma.play.upsert({
      where: { userId_gameId_playNumber: { userId, gameId, playNumber: body.playNumber } },
      update: { filmSide: body.filmSide, fields: body.fields },
      create: body,
    });

    return res.status(200).json(result);
  } catch (e) {
    console.error('plays upsert error', e);
    return res.status(401).json({ error: 'invalid_token' });
  }
} 