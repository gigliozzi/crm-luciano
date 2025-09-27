import { getDb } from '../db/connection.js';

export function requireRole(...allowed) {
  const set = new Set(allowed);
  return async function (req, res, next) {
    try {
      const role = req.user?.role;
      if (!role) return res.status(403).json({ message: 'Acesso negado' });
      if (set.size === 0 || set.has(role)) return next();
      return res.status(403).json({ message: 'Permissão insuficiente' });
    } catch (e) {
      return res.status(500).json({ message: 'Erro de autorização' });
    }
  };
}
