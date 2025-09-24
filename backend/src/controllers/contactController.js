import { getDb } from '../db/connection.js';
import { normalizePhoneE164 } from '../utils/phone.js';

function validateContactPayload(body) {
  const { firstName, lastName, birthDate } = body;
  if (!firstName || !lastName || !birthDate) {
    return 'Nome, sobrenome e data de nascimento são obrigatórios.';
  }
  return null;
}

export async function listContacts(req, res) {
  const db = await getDb();
  const contacts = await db.all(
    'SELECT * FROM contacts WHERE user_id = ? ORDER BY first_name, last_name',
    req.user.userId
  );
  return res.json({ contacts });
}

export async function getContact(req, res) {
  const db = await getDb();
  const contact = await db.get(
    'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
    req.params.id,
    req.user.userId
  );
  if (!contact) {
    return res.status(404).json({ message: 'Contato não encontrado.' });
  }
  return res.json({ contact });
}

export async function createContact(req, res) {
  const error = validateContactPayload(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const db = await getDb();
  const { firstName, lastName, birthDate, email } = req.body;
  const phone = normalizePhoneE164(req.body.phone) || null;
  const result = await db.run(
    `INSERT INTO contacts (user_id, first_name, last_name, birth_date, email, phone)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    req.user.userId,
    firstName,
    lastName,
    birthDate,
    email || null,
    phone
  );

  const contact = await db.get('SELECT * FROM contacts WHERE id = ?', result.lastID);
  return res.status(201).json({ contact });
}

export async function updateContact(req, res) {
  const db = await getDb();
  const { id } = req.params;
  const existing = await db.get(
    'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
    id,
    req.user.userId
  );
  if (!existing) {
    return res.status(404).json({ message: 'Contato não encontrado.' });
  }

  const { firstName, lastName, birthDate, email } = req.body;
  const error = validateContactPayload({ firstName: firstName || existing.first_name, lastName: lastName || existing.last_name, birthDate: birthDate || existing.birth_date });
  if (error) {
    return res.status(400).json({ message: error });
  }

  const phoneNorm = Object.prototype.hasOwnProperty.call(req.body, 'phone')
    ? (normalizePhoneE164(req.body.phone) || null)
    : existing.phone;

  await db.run(
    `UPDATE contacts
     SET first_name = ?, last_name = ?, birth_date = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    firstName || existing.first_name,
    lastName || existing.last_name,
    birthDate || existing.birth_date,
    email ?? existing.email,
    phoneNorm,
    id,
    req.user.userId
  );

  const contact = await db.get('SELECT * FROM contacts WHERE id = ?', id);
  return res.json({ contact });
}

export async function deleteContact(req, res) {
  const db = await getDb();
  const { id } = req.params;
  const result = await db.run(
    'DELETE FROM contacts WHERE id = ? AND user_id = ?',
    id,
    req.user.userId
  );

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Contato não encontrado.' });
  }

  return res.status(204).send();
}

export async function contactsWithBirthdayToday(req, res) {
  const db = await getDb();
  const contacts = await db.all(
    `SELECT * FROM contacts
     WHERE user_id = ?
       AND strftime('%m-%d', birth_date) = strftime('%m-%d', 'now', 'localtime')
     ORDER BY first_name, last_name`,
    req.user.userId
  );
  return res.json({ contacts });
}

