import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection.js';
import { config } from '../config/env.js';

/**
 * Authenticates a user via email/password and returns a JWT token.
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  const db = await getDb();
  const user = await db.get('SELECT id, email, password_hash, name, COALESCE(role,\'admin\') as role, COALESCE(is_active,1) as is_active FROM users WHERE email = ?', email);

  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  if (user.is_active === 0) {
    return res.status(403).json({ message: 'Usuário inativo.' });
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: '12h',
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

/**
 * (Optional) Registers a new user; kept simple for administrative onboarding.
 */
export async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Informe nome, e-mail e senha.' });
  }

  const db = await getDb();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
  if (existing) {
    return res.status(409).json({ message: 'E-mail já cadastrado.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.run(
    'INSERT INTO users (email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, 1)',
    email,
    passwordHash,
    name,
    'admin'
  );

  return res.status(201).json({ id: result.lastID, email, name, role: 'admin' });
}

/**
 * Simple endpoint to retrieve the authenticated profile information.
 */
export async function profile(req, res) {
  return res.json({ user: req.user });
}
