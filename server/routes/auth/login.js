import { prisma } from '../../lib/prisma.js';
import { verifyPassword, signAccessToken, signRefreshToken } from '../../lib/crypto.js';
import crypto from 'node:crypto';

export default async function login(req, res) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const { token: access_token, expiresIn } = signAccessToken(user);
    const { token: refresh, exp } = signRefreshToken(user);

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
    console.error('login error', e);
    return res.status(500).json({ error: 'server_error' });
  }
} 