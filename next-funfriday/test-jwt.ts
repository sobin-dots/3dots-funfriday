import { signToken, verifyToken } from './lib/jwt';
const token = signToken({ role: 'ADMIN', id: '123' });
console.log('Token:', token);
const decoded = verifyToken(token);
console.log('Decoded:', decoded);
