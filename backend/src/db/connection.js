import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

let dbPromise;

/**
 * Opens (or reuses) the SQLite connection; also ensures journaling pragmas.
 */
export async function getDb() {
  if (!dbPromise) {
    const dbPath = path.resolve(process.cwd(), config.databaseFile);
    await fs.promises.mkdir(path.dirname(dbPath), { recursive: true });
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database,
    }).then(async (db) => {
      await db.exec('PRAGMA foreign_keys = ON;');
      await db.exec('PRAGMA journal_mode = WAL;');
      return db;
    });
  }
  return dbPromise;
}

/**
 * Creates tables for users and contacts, and seeds a default administrator account.
 */
export async function initializeDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure role/is_active columns exist (SQLite ADD COLUMN is harmless if missing check prevented)
  const userCols = await db.all("PRAGMA table_info('users')");
  const names = userCols.map(c => c.name);
  if (!names.includes('role')) {
    await db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'");
  }
  if (!names.includes('is_active')) {
    await db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Logs de notificação para evitar envios duplicados no mesmo dia
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      kind TEXT NOT NULL,           -- ex: 'birthday_T-3'
      channel TEXT NOT NULL,        -- 'email' | 'whatsapp'
      log_date TEXT NOT NULL,       -- YYYY-MM-DD (data da execução)
      info TEXT,                    -- detalhes opcionais
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(contact_id, kind, channel, log_date),
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
  `);

  // Kanban tables (user-scoped for now)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS kanban_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      wip_limit INTEGER,
      is_closed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, key)
    );
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_kanban_stages_user_order
      ON kanban_stages(user_id, "order");
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS contact_stages (
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      stage_key TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id, contact_id),
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
  `);

  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', config.defaults.adminEmail);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(config.defaults.adminPassword, 10);
    await db.run(
      'INSERT INTO users (email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, 1)',
      config.defaults.adminEmail,
      passwordHash,
      'Administrador',
      'admin'
    );
  }

  // Seed default stages for all users that don't have any configured
  const users = await db.all('SELECT id FROM users');
  for (const u of users) {
    const row = await db.get('SELECT COUNT(*) as n FROM kanban_stages WHERE user_id = ?', u.id);
    if (!row || row.n === 0) {
      const defaults = [
        { key: 'new', label: 'Novo', is_closed: 0 },
        { key: 'qualifying', label: 'Qualificando', is_closed: 0 },
        { key: 'scheduled', label: 'Agendado', is_closed: 0 },
        { key: 'proposal', label: 'Proposta', is_closed: 0 },
        { key: 'won', label: 'Fechado (Ganho)', is_closed: 1 },
        { key: 'lost', label: 'Fechado (Perdido)', is_closed: 1 },
      ];
      let order = 0;
      for (const d of defaults) {
        await db.run(
          'INSERT OR IGNORE INTO kanban_stages (user_id, key, label, "order", is_closed) VALUES (?, ?, ?, ?, ?)',
          u.id,
          d.key,
          d.label,
          order++,
          d.is_closed ? 1 : 0
        );
      }
    }
  }
}
