import 'dotenv/config';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'super_secret_funfriday_key_123';

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '2d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}
