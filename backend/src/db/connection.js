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

  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', config.defaults.adminEmail);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(config.defaults.adminPassword, 10);
    await db.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      config.defaults.adminEmail,
      passwordHash,
      'Administrador'
    );
  }
}
