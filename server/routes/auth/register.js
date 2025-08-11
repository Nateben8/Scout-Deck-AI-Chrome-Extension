import { prisma } from '../../lib/prisma.js';
import { hashPassword, signAccessToken, signRefreshToken } from '../../lib/crypto.js';
import crypto from 'node:crypto';

export default async function register(req, res) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'email_exists' });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, name: name || null, passwordHash } });

    const { token: access_token, expiresIn } = signAccessToken(user);
    const { token: refresh, exp } = signRefreshToken(user);

    // Persist hashed refresh token
    const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(exp * 1000),
      },
    });

    return res.status(200).json({ access_token, refresh_token: refresh, expires_in: expiresIn, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ error: 'server_error' });
  }
} 