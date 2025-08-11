import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ACCESS_TTL_SEC = 3600; // 1h
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30d

export async function hashPassword(pw){
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

export async function verifyPassword(pw, hash){
  return bcrypt.compare(pw, hash);
}

export function signAccessToken(user){
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL_SEC });
  return { token, expiresIn: ACCESS_TTL_SEC };
}

export function signRefreshToken(user){
  const payload = { sub: user.id, typ: 'refresh' };
  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL_SEC });
  const exp = Math.floor(Date.now()/1000) + REFRESH_TTL_SEC;
  return { token, exp };
}

export function verifyRefreshToken(token){
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
} 