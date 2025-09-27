import { getDb } from '../db/connection.js';

export async function listStages(req, res) {
  const db = await getDb();
  const stages = await db.all(
    'SELECT id, key, label, "order", wip_limit, is_closed FROM kanban_stages WHERE user_id = ? ORDER BY "order"',
    req.user.userId
  );
  return res.json({ stages });
}

export async function upsertStages(req, res) {
  const { stages } = req.body || {};
  if (!Array.isArray(stages)) return res.status(400).json({ message: 'Campo stages inválido.' });
  const db = await getDb();
  await db.exec('BEGIN');
  try {
    for (const s of stages) {
      if (!s.key || typeof s.label !== 'string') continue;
      const order = Number.isFinite(s.order) ? s.order : 0;
      const wip = s.wip_limit ?? null;
      const closed = s.is_closed ? 1 : 0;
      await db.run(
        `INSERT INTO kanban_stages (user_id, key, label, "order", wip_limit, is_closed)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, key) DO UPDATE SET label=excluded.label, "order"=excluded."order", wip_limit=excluded.wip_limit, is_closed=excluded.is_closed`,
        req.user.userId, s.key, s.label, order, wip, closed
      );
    }
    await db.exec('COMMIT');
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
  const refreshed = await db.all(
    'SELECT id, key, label, "order", wip_limit, is_closed FROM kanban_stages WHERE user_id = ? ORDER BY "order"',
    req.user.userId
  );
  return res.json({ stages: refreshed });
}

export async function listLeads(req, res) {
  const db = await getDb();
  // Ensure every contact has a stage mapping (lazy create)
  const contacts = await db.all(
    'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
    req.user.userId
  );
  for (const c of contacts) {
    await db.run(
      'INSERT OR IGNORE INTO contact_stages (user_id, contact_id, stage_key, position) VALUES (?, ?, ?, ?)',
      req.user.userId,
      c.id,
      'new',
      0
    );
  }
  const leads = await db.all(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, cs.stage_key as stage, cs.position
     FROM contacts c
     JOIN contact_stages cs ON cs.user_id = c.user_id AND cs.contact_id = c.id
     WHERE c.user_id = ?`,
    req.user.userId
  );
  const mapped = leads.map((l) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name}`.trim(),
    email: l.email,
    phone: l.phone,
    stage: l.stage,
    position: l.position,
  }));
  return res.json({ leads: mapped });
}

export async function moveLead(req, res) {
  const { id } = req.params;
  const { toStage, position } = req.body || {};
  if (!toStage) return res.status(400).json({ message: 'toStage é obrigatório.' });
  const db = await getDb();

  // Validate target stage exists for the user
  const validStage = await db.get('SELECT 1 FROM kanban_stages WHERE user_id = ? AND key = ?', req.user.userId, toStage);
  if (!validStage) return res.status(400).json({ message: 'Etapa inválida.' });

  // Ensure the contact belongs to the user
  const cnt = await db.get('SELECT 1 FROM contacts WHERE id = ? AND user_id = ?', id, req.user.userId);
  if (!cnt) return res.status(404).json({ message: 'Lead/contato não encontrado.' });

  await db.exec('BEGIN');
  try {
    // Read current mapping; ensure exists
    let row = await db.get(
      'SELECT stage_key, position FROM contact_stages WHERE user_id = ? AND contact_id = ?',
      req.user.userId,
      id
    );
    if (!row) {
      await db.run(
        'INSERT INTO contact_stages (user_id, contact_id, stage_key, position) VALUES (?, ?, ?, ?)',
        req.user.userId,
        id,
        'new',
        0
      );
      row = { stage_key: 'new', position: 0 };
    }

    const fromStage = row.stage_key;
    const fromPos = row.position;

    // Clamp target position to current count range
    const countRow = await db.get(
      'SELECT COUNT(*) as n FROM contact_stages WHERE user_id = ? AND stage_key = ?',
      req.user.userId,
      toStage
    );
    const targetCount = countRow?.n ?? 0;
    let targetPos = Number.isFinite(position) ? Math.max(0, Math.min(position, targetCount)) : targetCount;

    if (fromStage === toStage) {
      if (targetPos === fromPos) {
        await db.exec('COMMIT');
        return res.json({ id: Number(id), stage: toStage, position: fromPos });
      }
      if (targetPos < fromPos) {
        // moving up: shift down items between targetPos..fromPos-1
        await db.run(
          'UPDATE contact_stages SET position = position + 1 WHERE user_id = ? AND stage_key = ? AND position >= ? AND position < ?',
          req.user.userId,
          toStage,
          targetPos,
          fromPos
        );
      } else {
        // moving down: shift up items between fromPos+1..targetPos
        await db.run(
          'UPDATE contact_stages SET position = position - 1 WHERE user_id = ? AND stage_key = ? AND position > ? AND position <= ?',
          req.user.userId,
          toStage,
          fromPos,
          targetPos
        );
      }
      await db.run(
        'UPDATE contact_stages SET position = ? WHERE user_id = ? AND contact_id = ?',
        targetPos,
        req.user.userId,
        id
      );
    } else {
      // moving across stages: compact source, make room in target
      await db.run(
        'UPDATE contact_stages SET position = position - 1 WHERE user_id = ? AND stage_key = ? AND position > ?',
        req.user.userId,
        fromStage,
        fromPos
      );
      await db.run(
        'UPDATE contact_stages SET position = position + 1 WHERE user_id = ? AND stage_key = ? AND position >= ?',
        req.user.userId,
        toStage,
        targetPos
      );
      await db.run(
        'UPDATE contact_stages SET stage_key = ?, position = ? WHERE user_id = ? AND contact_id = ?',
        toStage,
        targetPos,
        req.user.userId,
        id
      );
    }

    await db.exec('COMMIT');
    return res.json({ id: Number(id), stage: toStage, position: targetPos });
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}
