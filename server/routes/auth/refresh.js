import { prisma } from '../../lib/prisma.js';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '../../lib/crypto.js';
import crypto from 'node:crypto';

export default async function refresh(req, res) {
  try {
    const { refresh_token } = await req.json();
    if (!refresh_token) return res.status(400).json({ error: 'missing_refresh_token' });

    const payload = verifyRefreshToken(refresh_token);
    if (!payload?.sub) return res.status(401).json({ error: 'invalid_refresh' });

    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      return res.status(401).json({ error: 'refresh_not_found' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'user_not_found' });

    const { token: access_token, expiresIn } = signAccessToken(user);

    // Optionally rotate refresh token
    const { token: newRefresh, exp } = signRefreshToken(user);
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: { userId: user.id, tokenHash: newHash, expiresAt: new Date(exp * 1000) },
      }),
    ]);

    return res.status(200).json({ access_token, refresh_token: newRefresh, expires_in: expiresIn });
  } catch (e) {
    console.error('refresh error', e);
    return res.status(500).json({ error: 'server_error' });
  }
} 