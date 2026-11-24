import jwt from 'jsonwebtoken';
import { config } from '../lib/config.js';
import { query } from '../lib/db.js';
import { unauthorized, forbidden } from '../lib/errors.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized();
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw unauthorized('Invalid or expired token');
    }
    const { rows } = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [payload.sub]);
    if (!rows[0]) throw unauthorized('User no longer exists');
    req.user = rows[0];
    next();
  } catch (e) {
    next(e);
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(forbidden('Admin access required'));
  next();
}
